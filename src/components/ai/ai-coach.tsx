"use client";

import { useState } from "react";
import { AiNote } from "@/components/ai/ai-note";
import {
  AlertIcon,
  ArrowRightIcon,
  SparklesIcon,
  TargetIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { AiCoachResponse } from "@/lib/ai/types";
import { panel, panelHeader } from "@/lib/ui";

export function AiCoach({ aiEnabled }: { aiEnabled: boolean }) {
  const [result, setResult] = useState<AiCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!aiEnabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/coach", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate the coaching report.");
      }

      setResult(data as AiCoachResponse);
    } catch (coachError) {
      setError(
        coachError instanceof Error
          ? coachError.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const report = result?.report;

  return (
    <section className={panel}>
      <div className={panelHeader}>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">AI coach</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            What to focus on next.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={run}
          disabled={!aiEnabled || loading}
        >
          <SparklesIcon className="size-3.5" />
          {loading ? "Thinking…" : report ? "Refresh" : "Analyze deck"}
        </Button>
      </div>

      <div className="p-5">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {report.headline}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {report.assessment}
              </p>
            </div>

            {report.focus && (
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-indigo-300/70">
                  <TargetIcon className="size-3" />
                  Focus next
                </div>
                <p className="mt-1 text-sm font-medium text-indigo-100">
                  {report.focus}
                </p>
                {report.why && (
                  <p className="mt-1 text-[11px] leading-relaxed text-indigo-100/55">
                    {report.why}
                  </p>
                )}
              </div>
            )}

            {report.plan.length > 0 && (
              <ol className="space-y-2">
                {report.plan.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400"
                  >
                    <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-indigo-400/70" />
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : result?.raw ? (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
            {result.raw}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-600">
            {aiEnabled
              ? "Get a short read on your streak, weak spots and the best way to spend the next three days."
              : "AI is optional. Add a free OpenRouter key in .env to unlock the coach."}
          </p>
        )}

        {aiEnabled && (
          <AiNote model={result?.model} className="mt-4" />
        )}
      </div>
    </section>
  );
}
