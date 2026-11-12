import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializeProblem, serializeReview } from "@/lib/serialize";
import { isReadOnly } from "@/lib/auth";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { CopyButton } from "@/components/problems/copy-button";
import { ProblemDetailActions } from "@/components/problems/problem-detail-actions";
import { SolutionExplainer } from "@/components/ai/solution-explainer";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
} from "@/components/icons";
import { isAiEnabled } from "@/lib/ai/config";
import {
  dueLabel,
  formatDate,
  intervalLabel,
  relativeTime,
  type DueTone,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { panel, panelHeader } from "@/lib/ui";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const problem = await db.problem.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: problem?.title ?? "Problem" };
}

const TONE: Record<DueTone, string> = {
  danger: "text-rose-300",
  warn: "text-amber-300",
  soon: "text-indigo-300",
  muted: "text-zinc-500",
};

const RATING_LABELS = ["Again", "Hard", "Good", "Easy"];
const RATING_DOTS = [
  "bg-rose-400",
  "bg-amber-400",
  "bg-indigo-400",
  "bg-emerald-400",
];

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-600">{label}</dt>
      <dd className={cn("text-right font-medium text-zinc-300", accent)}>
        {value}
      </dd>
    </div>
  );
}

export default async function ProblemDetailPage({ params }: PageProps) {
  const { id } = await params;

  const problem = await db.problem.findUnique({
    where: { id },
    include: {
      reviews: { orderBy: { reviewedAt: "desc" }, take: 8 },
      _count: { select: { reviews: true } },
    },
  });

  if (!problem) notFound();

  const dto = serializeProblem(problem);
  const reviews = problem.reviews.map(serializeReview);
  const totalReviews = problem._count.reviews;
  const due = dueLabel(dto.dueAt);
  const readOnly = await isReadOnly();

  return (
    <div className="space-y-6">
      <Link
        href="/problems"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="size-3.5" />
        All problems
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={dto.difficulty} />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                dto.status === "SOLVED"
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20"
                  : "bg-white/[0.04] text-zinc-400 ring-white/10"
              )}
            >
              {dto.status === "SOLVED" ? "Solved" : "To do"}
            </span>
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
              {dto.platform}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {dto.title}
          </h1>

          {dto.url && (
            <a
              href={dto.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-300 transition-colors hover:text-indigo-200"
            >
              Open on {dto.platform}
              <ExternalLinkIcon className="size-3" />
            </a>
          )}
        </div>

        <ProblemDetailActions problem={dto} readOnly={readOnly} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">Notes</h2>
            </div>
            <div className="p-5">
              {dto.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {dto.notes}
                </p>
              ) : (
                <p className="text-sm text-zinc-600">
                  No notes yet. Edit the problem to capture the key idea, edge
                  cases or the mistake you made.
                </p>
              )}
            </div>
          </section>

          <section className={cn(panel, "overflow-hidden")}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">Solution</h2>
              {dto.solution && <CopyButton value={dto.solution} />}
            </div>
            {dto.solution ? (
              <pre className="max-h-[560px] overflow-auto bg-black/25 p-5 font-mono text-xs leading-relaxed text-zinc-300">
                <code>{dto.solution}</code>
              </pre>
            ) : (
              <p className="p-5 text-sm text-zinc-600">
                No solution saved yet.
              </p>
            )}
          </section>

          <SolutionExplainer
            problemId={dto.id}
            hasSolution={Boolean(dto.solution)}
            aiEnabled={isAiEnabled()}
          />
        </div>

        <aside className="space-y-4">
          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">Details</h2>
            </div>
            <dl className="space-y-3 p-5 text-xs">
              <Row label="Status" value={dto.status === "SOLVED" ? "Solved" : "To do"} />
              <Row
                label="Time spent"
                value={dto.timeSpentMin ? `${dto.timeSpentMin} min` : "—"}
              />
              <Row label="Added" value={formatDate(dto.createdAt)} />
              <Row
                label="Solved"
                value={dto.solvedAt ? formatDate(dto.solvedAt) : "—"}
              />
            </dl>
          </section>

          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">
                Review schedule
              </h2>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Next review
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-medium",
                    TONE[due.tone]
                  )}
                >
                  {dto.status === "SOLVED" ? due.text : "Not scheduled"}
                </p>
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <Row label="Ease" value={dto.ease.toFixed(2)} />
                <Row
                  label="Interval"
                  value={
                    dto.intervalDays > 0
                      ? intervalLabel(dto.intervalDays)
                      : "—"
                  }
                />
                <Row label="Repetitions" value={String(dto.repetitions)} />
                <Row
                  label="Last reviewed"
                  value={
                    dto.lastReviewedAt
                      ? relativeTime(dto.lastReviewedAt)
                      : "—"
                  }
                />
              </dl>
            </div>
          </section>

          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">History</h2>
            </div>
            <div className="p-5">
              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-600">No reviews yet.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {reviews.map((review) => (
                      <li
                        key={review.id}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="flex items-center gap-2 text-zinc-400">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              RATING_DOTS[review.rating] ?? "bg-zinc-500"
                            )}
                          />
                          {RATING_LABELS[review.rating] ?? "Reviewed"}
                        </span>
                        <span className="text-zinc-600">
                          {relativeTime(review.reviewedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {totalReviews > reviews.length && (
                    <p className="mt-3 border-t border-white/[0.05] pt-3 text-[10px] text-zinc-600">
                      +{totalReviews - reviews.length} earlier{" "}
                      {totalReviews - reviews.length === 1
                        ? "review"
                        : "reviews"}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
