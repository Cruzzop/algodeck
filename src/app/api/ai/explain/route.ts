import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseTopics } from "@/lib/serialize";
import { aiErrorResponse } from "@/lib/ai/http";
import { aiChat } from "@/lib/ai/chat";
import { explainMessages, parseExplanation } from "@/lib/ai/prompts";
import { aiProblemRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { problemId } = aiProblemRequestSchema.parse(await request.json());

    const problem = await db.problem.findUnique({
      where: { id: problemId },
      select: {
        title: true,
        platform: true,
        difficulty: true,
        topics: true,
        notes: true,
        solution: true,
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found." },
        { status: 404 }
      );
    }

    if (!problem.solution?.trim()) {
      return NextResponse.json(
        { error: "Add a solution before using the AI explainer." },
        { status: 400 }
      );
    }

    const result = await aiChat({
      messages: explainMessages({
        ...problem,
        solution: problem.solution,
        topics: parseTopics(problem.topics),
      }),
      maxTokens: 1_200,
      json: true,
    });

    const explanation = parseExplanation(result.text);

    return NextResponse.json({
      explanation,
      raw: explanation ? null : result.text.slice(0, 8_000),
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
