import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { parseTopics } from "@/lib/serialize";
import { aiErrorResponse } from "@/lib/ai/http";
import { aiChat } from "@/lib/ai/openrouter";
import { hintMessages } from "@/lib/ai/prompts";
import { aiHintRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { problemId, stage } = aiHintRequestSchema.parse(
      await request.json()
    );

    const problem = await db.problem.findUnique({
      where: { id: problemId },
      select: {
        title: true,
        platform: true,
        difficulty: true,
        topics: true,
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found." },
        { status: 404 }
      );
    }

    const result = await aiChat({
      messages: hintMessages(
        {
          ...problem,
          topics: parseTopics(problem.topics),
        },
        stage
      ),
      maxTokens: 450,
    });

    return NextResponse.json({
      hint: result.text,
      stage,
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
