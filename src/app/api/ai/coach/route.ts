import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";
import { aiErrorResponse } from "@/lib/ai/http";
import { aiChat } from "@/lib/ai/openrouter";
import { coachMessages, parseCoachReport } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const data = await getDashboardData();
    const result = await aiChat({
      messages: coachMessages(data),
      maxTokens: 700,
    });

    const report = parseCoachReport(result.text);

    return NextResponse.json({
      report,
      raw: report ? null : result.text.slice(0, 8_000),
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
