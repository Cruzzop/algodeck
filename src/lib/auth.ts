import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional read-only gate for shared deployments.
 *
 * Set DEMO_PASSWORD and the site stays fully browsable for visitors while
 * every write request requires an unlock cookie obtained through /unlock.
 * Leave DEMO_PASSWORD unset (local development) and everything behaves
 * exactly as before — no login, no friction.
 */
export const UNLOCK_COOKIE = "algodeck_gate";

export function gatePassword(): string | null {
  const password = process.env.DEMO_PASSWORD?.trim();
  return password || null;
}

export function isGateEnabled(): boolean {
  return gatePassword() !== null;
}

function expectedToken(): string {
  return createHash("sha256")
    .update(`algodeck-gate-v1:${gatePassword()}`)
    .digest("hex");
}

export function unlockToken(): string {
  return expectedToken();
}

export function hasValidUnlockToken(value: string | undefined): boolean {
  const password = gatePassword();
  if (!password || !value) return false;

  const expected = Buffer.from(expectedToken(), "hex");
  let given: Buffer;
  try {
    given = Buffer.from(value, "hex");
  } catch {
    return false;
  }

  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function isRequestUnlocked(request: NextRequest): boolean {
  return hasValidUnlockToken(request.cookies.get(UNLOCK_COOKIE)?.value);
}

/** 403 response for write requests during a locked demo, or null to continue. */
export function writeGuard(request: NextRequest): NextResponse | null {
  if (!isGateEnabled() || isRequestUnlocked(request)) return null;
  return NextResponse.json(
    {
      error:
        "This is a read-only demo. Unlock it with the demo password to make changes.",
    },
    { status: 403 }
  );
}

/** Gate state for server components. */
export async function gateState(): Promise<{
  enabled: boolean;
  unlocked: boolean;
}> {
  if (!isGateEnabled()) return { enabled: false, unlocked: false };
  const store = await cookies();
  return {
    enabled: true,
    unlocked: hasValidUnlockToken(store.get(UNLOCK_COOKIE)?.value),
  };
}

/** Convenience for pages: true while visitors are in read-only mode. */
export async function isReadOnly(): Promise<boolean> {
  const gate = await gateState();
  return gate.enabled && !gate.unlocked;
}

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Naive in-memory rate limiter for unlock attempts. Per server instance, so
 * it is a speed bump rather than a hard guarantee — good enough for a demo.
 */
export function isUnlockAllowed(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (attempts.size > 500) {
      for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
    }
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}
