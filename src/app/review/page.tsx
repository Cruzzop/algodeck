import { db } from "@/lib/db";
import { serializeProblem } from "@/lib/serialize";
import { endOfDay, startOfDay } from "@/lib/format";
import { isAiEnabled } from "@/lib/ai/config";
import { PageHeader } from "@/components/page-header";
import { ReviewSession } from "@/components/review/review-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review",
};

export default async function ReviewPage() {
  const now = new Date();
  const cutoff = endOfDay(now);

  const [due, next, reviewsToday] = await Promise.all([
    db.problem.findMany({
      where: { status: "SOLVED", dueAt: { lte: cutoff } },
      orderBy: { dueAt: "asc" },
      take: 30,
    }),
    db.problem.findFirst({
      where: { status: "SOLVED", dueAt: { gt: cutoff } },
      orderBy: { dueAt: "asc" },
    }),
    db.reviewLog.count({
      where: { reviewedAt: { gte: startOfDay(now) } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Spaced repetition"
        title="Review session"
        description={
          due.length > 0
            ? `${due.length} ${due.length === 1 ? "problem is" : "problems are"} due. Rate each card honestly — the schedule adapts to you.`
            : "Nothing is due right now. Solve something new, or come back when the next card is ready."
        }
      />

      <ReviewSession
        problems={due.map(serializeProblem)}
        nextDueAt={next?.dueAt?.toISOString() ?? null}
        reviewsToday={reviewsToday}
        aiEnabled={isAiEnabled()}
      />
    </div>
  );
}
