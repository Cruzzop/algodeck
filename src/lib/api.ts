import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Turns thrown errors into a consistent JSON error response. */
export function apiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "Invalid input",
        issues: error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong on the server." },
    { status: 500 }
  );
}
