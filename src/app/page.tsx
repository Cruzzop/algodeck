import Link from "next/link";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { DifficultyDonut } from "@/components/dashboard/difficulty-donut";
import { DueList } from "@/components/dashboard/due-list";
import { TopicBars } from "@/components/dashboard/topic-bars";
import { AiCoach } from "@/components/ai/ai-coach";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { buttonClass } from "@/components/ui/button";
import {
  CalendarIcon,
  CodeIcon,
  FlameIcon,
  PlusIcon,
  TargetIcon,
  TrendingUpIcon,
} from "@/components/icons";
import { isAiEnabled } from "@/lib/ai/config";
import { formatDate, pluralize } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";
import { panel, panelHeader } from "@/lib/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { totals } = data;

  if (totals.total === 0) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center sm:py-16">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-2xl shadow-indigo-500/25">
          <CodeIcon className="size-8 text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Welcome to AlgoDeck
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
          Track the problems you solve and let spaced repetition schedule each
          one for review right before you would forget it. No more re-solving
          the same problem from scratch.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Link href="/problems" className={buttonClass()}>
            <PlusIcon className="size-4" />
            Add your first problem
          </Link>
          <Link
            href="/review"
            className={buttonClass({ variant: "secondary" })}
          >
            See the review queue
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Want demo data?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Load 28 sample problems, review history and a live streak to see how
            everything fits together:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5 font-mono text-xs text-indigo-200">
            <code>npm run db:seed</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()} — here's your deck`}
        description={`${formatDate(new Date())} · ${totals.solved} of ${totals.total} problems solved.`}
        actions={
          <Link href="/problems" className={buttonClass()}>
            <PlusIcon className="size-4" />
            Add problem
          </Link>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TargetIcon}
          label="Solved"
          value={totals.solved}
          hint={`of ${totals.total} tracked · ${totals.todo} to go`}
          accent="indigo"
        />
        <StatCard
          icon={CalendarIcon}
          label="Due today"
          value={totals.dueToday}
          hint={`${totals.dueThisWeek} more due this week`}
          accent="amber"
        />
        <StatCard
          icon={FlameIcon}
          label="Streak"
          value={`${totals.streak}d`}
          hint={`${totals.reviewsToday} ${pluralize(totals.reviewsToday, "review")} today`}
          accent="rose"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Reviews · 30d"
          value={totals.reviews30d}
          hint={`${totals.reviews7d} in the last 7 days`}
          accent="emerald"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <section className={panel}>
            <div className={panelHeader}>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Activity</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {totals.reviews30d} reviews in the last 30 days
                </p>
              </div>
              <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
                {totals.reviewsToday} today
              </span>
            </div>
            <div className="p-5">
              <ActivityHeatmap days={data.heatmap} />
            </div>
          </section>

          <section className={panel}>
            <div className={panelHeader}>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Due for review
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {totals.dueToday === 0
                    ? "Nothing due right now"
                    : `${totals.dueToday} ${pluralize(totals.dueToday, "problem")} waiting`}
                </p>
              </div>
              <Link
                href="/review"
                className="text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
              >
                Start review →
              </Link>
            </div>
            <div className="px-5 py-2">
              <DueList problems={data.due} />
            </div>
            {totals.dueToday > 0 && (
              <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
                <span className="text-[11px] text-zinc-600">
                  {totals.dueThisWeek} coming up this week
                </span>
                <Link
                  href="/review"
                  className="text-[11px] font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  Review all {totals.dueToday} →
                </Link>
              </div>
            )}
          </section>

          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">
                Recently solved
              </h2>
            </div>
            <div className="p-5">
              {data.recent.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No solved problems yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recent.slice(0, 4).map((problem) => (
                    <li key={problem.id}>
                      <Link
                        href={`/problems/${problem.id}`}
                        className="group flex items-start gap-2.5"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs text-zinc-300 group-hover:text-white">
                            {problem.title}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-zinc-600">
                            {problem.solvedAt
                              ? formatDate(problem.solvedAt)
                              : "—"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">
                Difficulty
              </h2>
            </div>
            <div className="p-5">
              <DifficultyDonut data={data.difficulty} />
            </div>
          </section>

          <AiCoach aiEnabled={isAiEnabled()} />

          <section className={panel}>
            <div className={panelHeader}>
              <h2 className="text-sm font-semibold text-zinc-100">
                Top topics
              </h2>
            </div>
            <div className="p-5">
              <TopicBars topics={data.topics} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
