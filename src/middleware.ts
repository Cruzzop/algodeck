import { NextResponse, type NextRequest } from "next/server";

/**
 * Demo-gate helper. Middleware runs on the Edge runtime, so it duplicates the
 * tiny token check with Web Crypto instead of importing src/lib/auth (which
 * uses node:crypto). It only affects /unlock: an already-unlocked visitor is
 * sent home with a real HTTP redirect instead of the page's meta-refresh.
 *
 * The actual security lives in src/lib/auth.ts + the API write guards.
 */
const UNLOCK_COOKIE = "algodeck_gate";

async function unlockTokenFor(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`algodeck-gate-v1:${password}`)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD?.trim();
  if (!password || request.nextUrl.pathname !== "/unlock") {
    return NextResponse.next();
  }

  const token = request.cookies.get(UNLOCK_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const expected = await unlockTokenFor(password);
  if (token === expected) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/unlock"],
};
