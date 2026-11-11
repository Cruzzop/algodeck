import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { serializeProblem } from "@/lib/serialize";
import { scheduleReview, type Rating } from "@/lib/srs";
import { reviewSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { rating } = reviewSchema.parse(await request.json());

    const problem = await db.problem.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: "Problem not found." }, { status: 404 });
    }

    if (problem.status !== "SOLVED") {
      return NextResponse.json(
        { error: "Mark this problem as solved before reviewing it." },
        { status: 400 }
      );
    }

    const now = new Date();
    const next = scheduleReview(
      {
        ease: problem.ease,
        intervalDays: problem.intervalDays,
        repetitions: problem.repetitions,
      },
      rating as Rating,
      now
    );

    const [updated] = await db.$transaction([
      db.problem.update({
        where: { id },
        data: {
          ease: next.ease,
          intervalDays: next.intervalDays,
          repetitions: next.repetitions,
          dueAt: next.dueAt,
          lastReviewedAt: now,
          solvedAt: problem.solvedAt ?? now,
          status: "SOLVED",
        },
      }),
      db.reviewLog.create({
        data: { problemId: id, rating, reviewedAt: now },
      }),
    ]);

    return NextResponse.json({
      problem: serializeProblem(updated),
      nextDueAt: next.dueAt.toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
