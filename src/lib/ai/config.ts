/**
 * AI works out of the box through a keyless free provider. Adding a free
 * OpenRouter key upgrades it to the dynamic free-model chain.
 */
export function openRouterKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  return key || null;
}

export function isKeylessFallbackEnabled(): boolean {
  return process.env.AI_KEYLESS_FALLBACK?.trim().toLowerCase() !== "false";
}

export function isAiEnabled(): boolean {
  return Boolean(openRouterKey()) || isKeylessFallbackEnabled();
}

export function configuredModel(): string | null {
  return process.env.OPENROUTER_MODEL?.trim() || null;
}
