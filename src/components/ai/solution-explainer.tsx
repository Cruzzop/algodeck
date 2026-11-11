"use client";

import { useState } from "react";
import { AiNote } from "@/components/ai/ai-note";
import { AlertIcon, SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { AiExplainResponse } from "@/lib/ai/types";
import { panel, panelHeader } from "@/lib/ui";

export function SolutionExplainer({
  problemId,
  hasSolution,
  aiEnabled,
}: {
  problemId: string;
  hasSolution: boolean;
  aiEnabled: boolean;
}) {
  const [result, setResult] = useState<AiExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!aiEnabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate the explanation.");
      }

      setResult(data as AiExplainResponse);
    } catch (explainError) {
      setError(
        explainError instanceof Error
          ? explainError.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const explanation = result?.explanation;

  return (
    <section className={panel}>
      <div className={panelHeader}>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">AI explainer</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Turn your saved solution into a revision card.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={run}
          disabled={!aiEnabled || !hasSolution || loading}
        >
          <SparklesIcon className="size-3.5" />
          {loading ? "Thinking…" : result ? "Regenerate" : "Explain solution"}
        </Button>
      </div>

      <div className="p-5">
        {!aiEnabled ? (
          <p className="text-sm leading-relaxed text-zinc-600">
            AI is turned off. Add a free OpenRouter key or enable the built-in
            free provider in .env.
          </p>
        ) : !hasSolution ? (
          <p className="text-sm leading-relaxed text-zinc-600">
            Add a solution above and the explainer will break down the pattern,
            complexity and edge cases.
          </p>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : explanation ? (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {explanation.pattern && (
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-200 ring-1 ring-inset ring-indigo-400/25">
                    {explanation.pattern}
                  </span>
                )}
                {explanation.timeComplexity && (
                  <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.07]">
                    Time {explanation.timeComplexity}
                  </span>
                )}
                {explanation.spaceComplexity && (
                  <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.07]">
                    Space {explanation.spaceComplexity}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {explanation.summary}
              </p>
            </div>

            {explanation.steps.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  How it works
                </p>
                <ol className="mt-2.5 space-y-2">
                  {explanation.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 text-xs leading-relaxed text-zinc-400"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-white/[0.04] text-[10px] font-semibold text-zinc-500 ring-1 ring-inset ring-white/[0.07]">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {explanation.edgeCases.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  Edge cases
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {explanation.edgeCases.map((edgeCase, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-xs leading-relaxed text-zinc-400"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400" />
                      {edgeCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.interviewTip && (
              <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.05] px-3.5 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-indigo-300/70">
                  Interview tip
                </p>
                <p className="mt-1 text-xs leading-relaxed text-indigo-100/80">
                  {explanation.interviewTip}
                </p>
              </div>
            )}
          </div>
        ) : result?.raw ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {result.raw}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-600">
            Get a second pass over your code: the pattern, complexity, edge
            cases and one interview tip.
          </p>
        )}

        {aiEnabled && (
          <AiNote model={result?.model} className="mt-4" />
        )}
      </div>
    </section>
  );
}
