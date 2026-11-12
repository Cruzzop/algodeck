import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api";
import { writeGuard } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/format";
import { joinTopics, serializeProblem, serializeReview } from "@/lib/serialize";
import { updateProblemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const problem = await db.problem.findUnique({
      where: { id },
      include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 50 } },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    return NextResponse.json({
      problem: serializeProblem(problem),
      reviews: problem.reviews.map(serializeReview),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const denied = writeGuard(request);
    if (denied) return denied;

    const { id } = await params;
    const input = updateProblemSchema.parse(await request.json());

    const existing = await db.problem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    const data: Prisma.ProblemUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.url !== undefined) data.url = input.url || null;
    if (input.platform !== undefined) data.platform = input.platform;
    if (input.difficulty !== undefined) data.difficulty = input.difficulty;
    if (input.topics !== undefined) data.topics = joinTopics(input.topics);
    if (input.notes !== undefined) data.notes = input.notes.trim() || null;
    if (input.solution !== undefined) {
      data.solution = input.solution.trim() || null;
    }
    if (input.timeSpentMin !== undefined) {
      data.timeSpentMin = input.timeSpentMin;
    }

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "SOLVED" && !existing.solvedAt) {
        data.solvedAt = new Date();
        if (!existing.dueAt) {
          data.dueAt = addDays(startOfDay(new Date()), 1);
        }
      }
    }

    const problem = await db.problem.update({ where: { id }, data });

    return NextResponse.json({ problem: serializeProblem(problem) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const denied = writeGuard(request);
    if (denied) return denied;

    const { id } = await params;
    const existing = await db.problem.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    await db.problem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
