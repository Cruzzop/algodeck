"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertIcon,
  BookIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  LightbulbIcon,
  LockIcon,
} from "@/components/icons";
import type { AiHintResponse } from "@/lib/ai/types";
import { dueLabel, pluralize, type DueTone } from "@/lib/format";
import { RATINGS, previewSchedule, type Rating } from "@/lib/srs";
import type { ProblemDTO } from "@/lib/types";
import { cn } from "@/lib/cn";
import { panel } from "@/lib/ui";

const TONE: Record<DueTone, string> = {
  danger: "text-rose-300",
  warn: "text-amber-300",
  soon: "text-indigo-300",
  muted: "text-zinc-500",
};

export function ReviewSession({
  problems,
  nextDueAt,
  reviewsToday,
  aiEnabled,
  readOnly = false,
}: {
  problems: ProblemDTO[];
  nextDueAt: string | null;
  reviewsToday: number;
  aiEnabled: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();

  const [queue] = useState(problems);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintStage, setHintStage] = useState(0);
  const [hintModel, setHintModel] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const hintToken = useRef(0);

  const current = queue[index];
  const previews = useMemo(
    () => (current ? previewSchedule(current) : []),
    [current]
  );

  useEffect(() => {
    hintToken.current += 1;
    setHint(null);
    setHintStage(0);
    setHintModel(null);
    setHintError(null);
    setHintLoading(false);
  }, [index]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current || busy) return;

      if (readOnly) {
        setError("Read-only demo — unlock to record reviews.");
        return;
      }

      setBusy(true);
      setError(null);

      try {
        const response = await fetch(`/api/problems/${current.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not save the review.");
        }

        setCounts((previous) => ({
          ...previous,
          [rating]: previous[rating] + 1,
        }));
        setReviewed((count) => count + 1);

        if (index + 1 >= queue.length) {
          setFinished(true);
          router.refresh();
        } else {
          setIndex((value) => value + 1);
          setRevealed(false);
        }
      } catch (reviewError) {
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : "Something went wrong."
        );
      } finally {
        setBusy(false);
      }
    },
    [current, busy, index, queue.length, readOnly, router]
  );

  const requestHint = useCallback(async () => {
    if (!aiEnabled || !current || hintLoading) return;

    const token = hintToken.current;
    const nextStage = Math.min(3, hintStage + 1);

    setHintLoading(true);
    setHintError(null);

    try {
      const response = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: current.id, stage: nextStage }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not fetch a hint.");
      }

      // The card may have advanced while the request was in flight.
      if (token !== hintToken.current) return;

      const hintResponse = data as AiHintResponse;
      setHint(hintResponse.hint);
      setHintStage(nextStage);
      setHintModel(hintResponse.model);
    } catch (hintFailure) {
      if (token !== hintToken.current) return;
      setHintError(
        hintFailure instanceof Error
          ? hintFailure.message
          : "Something went wrong."
      );
    } finally {
      if (token === hintToken.current) setHintLoading(false);
    }
  }, [aiEnabled, current, hintLoading, hintStage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finished || !current) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      ) {
        return;
      }

      if ((event.code === "Space" || event.key === "Enter") && !revealed) {
        event.preventDefault();
        setRevealed(true);
        return;
      }

      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        requestHint();
        return;
      }

      if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        rate((Number(event.key) - 1) as Rating);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealed, rate, requestHint, finished, current]);

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={CheckCircleIcon}
        title="You're all caught up"
        description={
          nextDueAt
            ? `Nothing is due right now. Next review: ${dueLabel(nextDueAt).text}.`
            : "Add a problem and mark it solved to start building your review queue."
        }
      >
        <Link href="/problems" className={buttonClass({ variant: "secondary" })}>
          Browse problems
        </Link>
        <Link href="/" className={buttonClass({ variant: "ghost" })}>
          Back to dashboard
        </Link>
      </EmptyState>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-xl">
        <div className={cn(panel, "p-8 text-center")}>
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
            <CheckCircleIcon className="size-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Session complete
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500">
            You reviewed {reviewed} {pluralize(reviewed, "problem")}. Every card
            has a fresh due date.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => (
              <div
                key={rating.value}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                <p className="text-lg font-semibold tabular-nums text-white">
                  {counts[rating.value]}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                  {rating.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href="/" className={buttonClass()}>
              Back to dashboard
            </Link>
            <Link
              href="/problems"
              className={buttonClass({ variant: "secondary" })}
            >
              Browse problems
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const due = current.dueAt ? dueLabel(current.dueAt) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          Card <span className="text-zinc-300">{index + 1}</span> of{" "}
          {queue.length}
        </span>
        <span>
          {reviewsToday + reviewed}{" "}
          {pluralize(reviewsToday + reviewed, "review")} today
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      <div className={cn(panel, "overflow-hidden")}>
        <div className="border-b border-white/[0.06] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={current.difficulty} />
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
              {current.platform}
            </span>
            {due && (
              <span className={cn("text-[11px]", TONE[due.tone])}>
                {due.text}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {current.title}
          </h2>

          {current.topics.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {current.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {hint && (
            <div className="mb-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-300/70">
                <LightbulbIcon className="size-3.5" />
                Hint {hintStage} of 3
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-amber-50/85">
                {hint}
              </p>
              {hintModel && (
                <p
                  className="mt-2 truncate text-[10px] text-amber-200/40"
                  title={hintModel}
                >
                  via {hintModel}
                </p>
              )}
            </div>
          )}

          {hintError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              {hintError}
            </div>
          )}

          {!revealed ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center sm:py-10">
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                Try to recall the approach and its edge cases before revealing
                the answer.
              </p>
              <Button onClick={() => setRevealed(true)}>
                <BookIcon className="size-4" />
                Show notes &amp; solution
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={requestHint}
                disabled={!aiEnabled || hintLoading}
                title={
                  aiEnabled
                    ? "Get a nudge without spoiling the full solution"
                    : "Add a free OpenRouter key in .env to unlock AI hints"
                }
              >
                <LightbulbIcon className="size-4" />
                {hintLoading
                  ? "Thinking…"
                  : hintStage > 0
                    ? "Another hint"
                    : "Get a hint"}
              </Button>
              {!aiEnabled && (
                <p className="-mt-2 text-[10px] text-zinc-600">
                  AI hints are off — add a free OpenRouter key or enable the
                  built-in free provider.
                </p>
              )}
              <p className="text-[11px] text-zinc-600">
                press{" "}
                <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px]">
                  space
                </kbd>{" "}
                to reveal
                {aiEnabled && (
                  <>
                    {" · "}
                    <kbd className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px]">
                      h
                    </kbd>{" "}
                    for a hint
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {current.notes && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                    Notes
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                    {current.notes}
                  </p>
                </div>
              )}

              {current.solution ? (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                    Solution
                  </p>
                  <pre className="mt-1.5 max-h-64 overflow-auto rounded-lg border border-white/[0.06] bg-black/25 p-3.5 font-mono text-xs leading-relaxed text-zinc-300">
                    <code>{current.solution}</code>
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  No solution saved for this problem yet.
                </p>
              )}

              {current.url && (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  Open the problem
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {revealed && (
          <div className="border-t border-white/[0.06] bg-white/[0.01] p-4 sm:p-5">
            {readOnly ? (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-4 text-center">
                <p className="flex items-center gap-2 text-xs text-amber-200/80">
                  <LockIcon className="size-3.5 shrink-0" />
                  Read-only demo — reviews are not recorded.
                </p>
                <Link
                  href="/unlock"
                  className="text-xs font-medium text-amber-200 underline-offset-2 transition-colors hover:underline"
                >
                  Unlock to review
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  How did it go?
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATINGS.map((rating, ratingIndex) => (
                    <button
                      key={rating.value}
                      type="button"
                      disabled={busy}
                      onClick={() => rate(rating.value)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                        rating.className
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {rating.label}
                        <kbd className="rounded border border-white/15 px-1 py-0.5 text-[9px] font-normal opacity-60">
                          {rating.hint}
                        </kbd>
                      </span>
                      <span className="text-[10px] font-normal opacity-60">
                        {previews[ratingIndex]?.interval}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
