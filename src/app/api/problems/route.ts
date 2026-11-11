import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/format";
import { joinTopics, serializeProblem } from "@/lib/serialize";
import { createProblemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim();
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") ?? "recent";

    const where: Prisma.ProblemWhereInput = {};

    if (status === "TODO" || status === "SOLVED") {
      where.status = status;
    }

    if (difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD") {
      where.difficulty = difficulty;
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { topics: { contains: query } },
        { platform: { contains: query } },
      ];
    }

    const orderBy: Prisma.ProblemOrderByWithRelationInput =
      sort === "title"
        ? { title: "asc" }
        : sort === "due"
          ? { dueAt: "asc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : { updatedAt: "desc" };

    const problems = await db.problem.findMany({ where, orderBy });

    return NextResponse.json({ problems: problems.map(serializeProblem) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = createProblemSchema.parse(await request.json());
    const now = new Date();
    const isSolved = input.status === "SOLVED";

    const problem = await db.problem.create({
      data: {
        title: input.title,
        url: input.url || null,
        platform: input.platform,
        difficulty: input.difficulty,
        status: input.status,
        topics: joinTopics(input.topics),
        notes: input.notes?.trim() || null,
        solution: input.solution?.trim() || null,
        timeSpentMin: input.timeSpentMin,
        solvedAt: isSolved ? now : null,
        dueAt: isSolved ? addDays(startOfDay(now), 1) : null,
        intervalDays: isSolved ? 1 : 0,
      },
    });

    return NextResponse.json(
      { problem: serializeProblem(problem) },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
