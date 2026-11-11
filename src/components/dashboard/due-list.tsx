import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
} from "@/components/icons";
import { dueLabel, type DueTone } from "@/lib/format";
import { DIFFICULTY_STYLES } from "@/lib/constants";
import type { ProblemDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONE: Record<DueTone, string> = {
  danger: "text-rose-300",
  warn: "text-amber-300",
  soon: "text-indigo-300",
  muted: "text-zinc-500",
};

export function DueList({ problems }: { problems: ProblemDTO[] }) {
  if (problems.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
        <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-200">All caught up</p>
          <p className="mt-0.5 text-xs text-emerald-200/50">
            Nothing is due right now. Come back when the next card is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.05]">
      {problems.map((problem) => {
        const due = dueLabel(problem.dueAt);
        const style = DIFFICULTY_STYLES[problem.difficulty];
        return (
          <li key={problem.id}>
            <Link
              href={`/problems/${problem.id}`}
              className="group flex items-center gap-3 py-2.5 transition-colors"
            >
              <span className={cn("size-2 shrink-0 rounded-full", style.dot)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-300 group-hover:text-white">
                  {problem.title}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  {problem.platform}
                  {problem.topics.length > 0 &&
                    ` · ${problem.topics.slice(0, 2).join(", ")}`}
                </p>
              </div>
              <span className={cn("shrink-0 text-[11px]", TONE[due.tone])}>
                {due.text}
              </span>
              <ArrowRightIcon className="size-3.5 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
