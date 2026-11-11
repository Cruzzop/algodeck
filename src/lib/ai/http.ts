import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { AiError } from "./errors";

export function aiErrorResponse(error: unknown): NextResponse {
  if (error instanceof AiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return apiError(error);
}
