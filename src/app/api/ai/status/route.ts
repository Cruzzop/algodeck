import { NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/http";
import { getAiStatus } from "@/lib/ai/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    return NextResponse.json(await getAiStatus());
  } catch (error) {
    return aiErrorResponse(error);
  }
}
