import { NextResponse, type NextRequest } from "next/server";
import {
  UNLOCK_COOKIE,
  gatePassword,
  isUnlockAllowed,
  unlockToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const password = gatePassword();
  if (!password) {
    return NextResponse.json(
      { error: "Password protection is not enabled on this deployment." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!isUnlockAllowed(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const given =
    typeof input === "object" && input !== null
      ? String((input as { password?: unknown }).password ?? "")
      : "";

  if (given.trim() !== password) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: UNLOCK_COOKIE,
    value: unlockToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: UNLOCK_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
