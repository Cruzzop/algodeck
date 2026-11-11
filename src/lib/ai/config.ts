/**
 * AI is optional. A free OpenRouter API key unlocks it, but the rest of the
 * app works without one.
 */
export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function configuredModel(): string | null {
  return process.env.OPENROUTER_MODEL?.trim() || null;
}
