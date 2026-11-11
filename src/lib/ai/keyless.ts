import { AiError } from "./errors";
import type { ChatMessage } from "./types";

/**
 * Pollinations' Classic API is free, keyless and OpenAI-compatible. It allows
 * one text request every 30 seconds per IP, so it is the zero-setup fallback
 * rather than the primary provider when an OpenRouter key is available.
 */
const KEYLESS_API = "https://text.pollinations.ai/openai";
const KEYLESS_MODEL = "openai-fast";
const REQUEST_TIMEOUT_MS = 50_000;

type KeylessBody = {
  choices?: {
    message?: { content?: string | { text?: string }[] | null };
  }[];
  model?: string;
  error?: { message?: unknown } | string;
};

function extractText(body: unknown): string {
  const payload = body as KeylessBody;
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

function retrySeconds(response: Response): number {
  const header = Number(response.headers.get("retry-after"));
  return Number.isFinite(header) && header > 0 ? Math.ceil(header) : 30;
}

export async function keylessChat(options: {
  messages: ChatMessage[];
  maxTokens?: number;
  json?: boolean;
}): Promise<{ text: string; model: string }> {
  let response: Response;

  try {
    response = await fetch(KEYLESS_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: KEYLESS_MODEL,
        messages: options.messages,
        max_tokens: options.maxTokens ?? 900,
        reasoning_effort: "low",
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.warn(
      "[ai] Keyless provider request failed:",
      error instanceof Error ? error.message : error
    );
    throw new AiError(
      "Could not reach the free AI provider. Check your connection and try again.",
      502
    );
  }

  const rawBody = await response.text();
  let body: unknown = null;

  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (response.status === 402) {
      throw new AiError(
        `Free AI is cooling down. Try again in about ${retrySeconds(response)} seconds.`,
        429
      );
    }

    if (response.status === 429) {
      throw new AiError(
        "The free AI provider is busy. Please try again in about 30 seconds.",
        429
      );
    }

    const errorField = (body as KeylessBody | null)?.error;
    const providerMessage = String(
      typeof errorField === "string"
        ? errorField
        : errorField?.message ?? rawBody
    ).slice(0, 240);

    console.error(
      `[ai] Keyless provider returned ${response.status}:`,
      providerMessage
    );

    throw new AiError(
      "The free AI provider returned an error. Please try again in a minute.",
      502
    );
  }

  const text = extractText(body);
  if (!text) {
    throw new AiError(
      "The free AI provider returned an empty response. Please try again.",
      502
    );
  }

  const actualModel =
    typeof (body as KeylessBody | null)?.model === "string"
      ? String((body as KeylessBody).model)
      : KEYLESS_MODEL;

  return { text, model: `pollinations/${actualModel}` };
}
