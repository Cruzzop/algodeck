import { configuredModel, isAiEnabled } from "./config";
import type { AiStatus, ChatMessage } from "./types";

const OPENROUTER_API = "https://openrouter.ai/api/v1";
const MODEL_CACHE_MS = 30 * 60 * 1000;
const FAILED_MODEL_MS = 10 * 60 * 1000;
const REQUEST_BUDGET_MS = 55 * 1000;
const PER_MODEL_TIMEOUT_MS = 40 * 1000;
const MAX_ATTEMPTS = 4;

type ModelInfo = {
  id: string;
  contextLength: number;
};

/**
 * A curated quality order. This is only a hint: models that are missing from
 * the live OpenRouter list are skipped, and anything new is still considered.
 */
const PREFERRED_FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "baidu/ernie-5.5-flash-preview:free",
  "thinkingmachines/inkling-2-small:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "dots-studio/dots-3-note-preview:free",
  "recursive/flint-v1.0:free",
  "cohere/north-mini-code:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-3-1.7b:free",
  "liquid/lfm-2.5-2.6b:free",
];

/**
 * Last-resort IDs used only when the live model catalogue cannot be reached.
 * Even this list is allowed to go stale: failures trigger the next candidate,
 * and the final `openrouter/free` alias delegates selection to OpenRouter.
 */
const FALLBACK_MODELS: ModelInfo[] = [
  { id: "google/gemma-4-31b-it:free", contextLength: 262_144 },
  { id: "baidu/ernie-5.5-flash-preview:free", contextLength: 1_024_000 },
  { id: "thinkingmachines/inkling-2-small:free", contextLength: 1_048_576 },
  { id: "nvidia/nemotron-3.5-super-vl:free", contextLength: 1_000_000 },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", contextLength: 1_000_000 },
  { id: "dots-studio/dots-3-note-preview:free", contextLength: 512_000 },
  { id: "recursive/flint-v1.0:free", contextLength: 262_144 },
  { id: "cohere/north-mini-code:free", contextLength: 256_000 },
  { id: "openrouter/free", contextLength: 200_000 },
];

let modelCache: { fetchedAt: number; models: ModelInfo[] } | null = null;
let lastGoodModel: string | null = null;
const failedModels = new Map<string, number>();

export class AiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

function isFreeTextModel(model: Record<string, unknown>): boolean {
  const pricing = model.pricing as
    | { prompt?: string | number; completion?: string | number }
    | undefined;
  const architecture = model.architecture as
    | { output_modalities?: string[]; modality?: string }
    | undefined;

  if (!pricing || Number(pricing.prompt) !== 0 || Number(pricing.completion) !== 0) {
    return false;
  }

  const output = architecture?.output_modalities ?? ["text"];
  if (!output.includes("text")) return false;
  if (output.some((kind) => ["audio", "image", "embedding"].includes(kind))) {
    return false;
  }

  const id = String(model.id ?? "");
  if (!id) return false;

  return !/(lyria|whisper|tts|rerank|embed|moderation|guard|safety)/i.test(id);
}

async function fetchFreeModels(): Promise<ModelInfo[]> {
  if (modelCache && Date.now() - modelCache.fetchedAt < MODEL_CACHE_MS) {
    return modelCache.models;
  }

  try {
    const response = await fetch(`${OPENROUTER_API}/models`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Model catalogue returned ${response.status}`);
    }

    const payload = (await response.json()) as { data?: Record<string, unknown>[] };
    const models = (payload.data ?? [])
      .filter(isFreeTextModel)
      .map((model) => ({
        id: String(model.id),
        contextLength: Number(model.context_length) || 0,
      }));

    if (models.length === 0) {
      throw new Error("No free text models were returned");
    }

    modelCache = { fetchedAt: Date.now(), models };
    return models;
  } catch (error) {
    // The catalogue is a convenience, not a hard dependency. Keep serving from
    // the previous cache or the built-in fallbacks.
    console.warn(
      "[ai] Could not refresh the free model catalogue:",
      error instanceof Error ? error.message : error
    );
    return modelCache?.models ?? FALLBACK_MODELS;
  }
}

function rankModels(models: ModelInfo[]): string[] {
  const available = new Set(models.map((model) => model.id));
  const ranked: string[] = [];

  for (const id of PREFERRED_FREE_MODELS) {
    if (available.has(id)) ranked.push(id);
  }

  const rest = models
    .filter(
      (model) => !ranked.includes(model.id) && model.id !== "openrouter/free"
    )
    .sort((a, b) => b.contextLength - a.contextLength)
    .map((model) => model.id);

  ranked.push(...rest);

  // OpenRouter's own free router is the ultimate fallback. If a specific free
  // model disappears tomorrow, this alias keeps the feature alive.
  ranked.push("openrouter/free");

  return [...new Set(ranked)];
}

function isStillUsable(id: string): boolean {
  const until = failedModels.get(id);
  if (!until) return true;
  if (until <= Date.now()) {
    failedModels.delete(id);
    return true;
  }
  return false;
}

async function buildChain(): Promise<string[]> {
  const models = await fetchFreeModels();
  const chain = [configuredModel(), lastGoodModel, ...rankModels(models)].filter(
    (id): id is string => Boolean(id)
  );

  return [...new Set(chain)].filter(isStillUsable);
}

function extractText(body: unknown): string {
  const payload = body as {
    choices?: {
      message?: { content?: string | { text?: string }[] | null };
    }[];
  };
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text ?? ""))
      .join("\n")
      .trim();
  }
  return "";
}

function isModelProblem(status: number, message: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  return /model|endpoint|provider|not found|unavailable|deprecated|invalid|support/i.test(
    message
  );
}

export async function aiChat(options: {
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new AiError(
      "AI is not configured. Add a free OPENROUTER_API_KEY to .env — see the README.",
      503
    );
  }

  const chain = await buildChain();
  if (chain.length === 0) {
    throw new AiError(
      "No free AI models are available right now. Please try again in a minute.",
      502
    );
  }

  const deadline = Date.now() + REQUEST_BUDGET_MS;
  let lastError: unknown = null;

  for (const model of chain.slice(0, MAX_ATTEMPTS)) {
    const remaining = deadline - Date.now();
    if (remaining < 4_000) break;

    try {
      const response = await fetch(`${OPENROUTER_API}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
          "X-Title": "AlgoDeck",
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          max_tokens: options.maxTokens ?? 900,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(
          Math.min(PER_MODEL_TIMEOUT_MS, remaining)
        ),
      });

      const rawBody = await response.text();
      let body: unknown = null;

      try {
        body = JSON.parse(rawBody);
      } catch {
        body = null;
      }

      if (!response.ok) {
        const errorMessage = String(
          (body as { error?: { message?: unknown } } | null)?.error?.message ??
            rawBody.slice(0, 240)
        );

        if (response.status === 401 || response.status === 403) {
          throw new AiError(
            "OpenRouter rejected the API key. Check OPENROUTER_API_KEY in .env.",
            503
          );
        }

        if (isModelProblem(response.status, errorMessage)) {
          failedModels.set(model, Date.now() + FAILED_MODEL_MS);
          lastError = new Error(`${model}: ${errorMessage}`);
          continue;
        }

        if ([402, 429, 500, 502, 503, 504].includes(response.status)) {
          lastError = new Error(`${model}: ${errorMessage}`);
          continue;
        }

        throw new AiError(
          `The AI provider returned an error (${response.status}). Please try again.`,
          502
        );
      }

      const text = extractText(body);
      if (!text) {
        lastError = new Error(`${model}: empty response`);
        continue;
      }

      lastGoodModel = model;
      const actualModel =
        typeof (body as { model?: unknown }).model === "string"
          ? String((body as { model: string }).model)
          : model;

      return { text, model: actualModel };
    } catch (error) {
      if (error instanceof AiError) throw error;
      lastError = error;
      // Timeouts and network errors are model-specific enough to try the next
      // free candidate instead of failing the whole request.
    }
  }

  console.error(
    "[ai] Every free model attempt failed:",
    lastError instanceof Error ? lastError.message : lastError
  );

  throw new AiError(
    "Every free AI model failed just now. Free models are rate-limited — please try again in a minute.",
    502
  );
}

export async function getAiStatus(): Promise<AiStatus> {
  const models = await fetchFreeModels();
  return {
    enabled: isAiEnabled(),
    configuredModel: configuredModel(),
    freeModelCount: models.length,
    chain: rankModels(models),
    lastGoodModel,
  };
}
