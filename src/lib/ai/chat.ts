import {
  configuredModel,
  isKeylessFallbackEnabled,
  openRouterKey,
} from "./config";
import { AiError } from "./errors";
import { keylessChat } from "./keyless";
import { getOpenRouterStatus, openRouterChat } from "./openrouter";
import type { AiStatus, ChatMessage } from "./types";

/**
 * Provider order:
 *   1. OpenRouter free-model chain (only when a free key is configured).
 *   2. Keyless free provider (works with no signup).
 *
 * If OpenRouter fails for any reason, the keyless provider still answers, so
 * AI stays available even when a free model disappears or is rate-limited.
 */
export async function aiChat(options: {
  messages: ChatMessage[];
  maxTokens?: number;
  json?: boolean;
}): Promise<{ text: string; model: string }> {
  if (openRouterKey()) {
    try {
      return await openRouterChat(options);
    } catch (error) {
      console.warn(
        "[ai] OpenRouter failed, trying the keyless provider:",
        error instanceof Error ? error.message : error
      );
      if (!isKeylessFallbackEnabled()) throw error;
    }
  }

  if (isKeylessFallbackEnabled()) {
    return keylessChat(options);
  }

  throw new AiError(
    "AI is turned off. Add a free OPENROUTER_API_KEY to .env or enable AI_KEYLESS_FALLBACK.",
    503
  );
}

export async function getAiStatus(): Promise<AiStatus> {
  const hasOpenRouter = Boolean(openRouterKey());
  const keylessEnabled = isKeylessFallbackEnabled();
  const openRouterStatus = hasOpenRouter
    ? await getOpenRouterStatus()
    : { freeModelCount: 0, chain: [], lastGoodModel: null };

  return {
    enabled: hasOpenRouter || keylessEnabled,
    provider: hasOpenRouter ? "openrouter" : keylessEnabled ? "keyless" : "off",
    keylessEnabled,
    configuredModel: configuredModel(),
    ...openRouterStatus,
  };
}
