import { db } from "./db";
import { addDays, endOfDay, startOfDay, toDateKey } from "./format";
import { parseTopics, serializeProblem } from "./serialize";
import type { Difficulty } from "./constants";
import type { DashboardData } from "./types";

const DIFFICULTY_META: { key: Difficulty; label: string }[] = [
  { key: "EASY", label: "Easy" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HARD", label: "Hard" },
];

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const [problems, logs] = await Promise.all([
    db.problem.findMany(),
    db.reviewLog.findMany({ select: { reviewedAt: true } }),
  ]);

  const solved = problems.filter((problem) => problem.status === "SOLVED");

  const due = solved
    .filter((problem) => problem.dueAt !== null && problem.dueAt <= todayEnd)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());

  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = toDateKey(log.reviewedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let streak = 0;
  let cursor = todayStart;
  if (!counts.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  while (counts.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const sevenDaysAgo = addDays(todayStart, -6).getTime();
  const thirtyDaysAgo = addDays(todayStart, -29).getTime();

  const heatmapStart = addDays(todayStart, -todayStart.getDay() - 175);
  const heatmap = Array.from({ length: 182 }, (_, index) => {
    const day = addDays(heatmapStart, index);
    const date = toDateKey(day);
    return {
      date,
      count: counts.get(date) ?? 0,
      future: day.getTime() > todayStart.getTime(),
    };
  });

  const activity = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(todayStart, index - 6);
    const date = toDateKey(day);
    return {
      date,
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: counts.get(date) ?? 0,
    };
  });

  const topicCount = new Map<string, number>();
  for (const problem of solved) {
    for (const topic of parseTopics(problem.topics)) {
      topicCount.set(topic, (topicCount.get(topic) ?? 0) + 1);
    }
  }

  const difficulty = DIFFICULTY_META.map(({ key, label }) => ({
    key,
    label,
    total: problems.filter((problem) => problem.difficulty === key).length,
    solved: solved.filter((problem) => problem.difficulty === key).length,
  }));

  const recent = solved
    .filter((problem) => problem.solvedAt !== null)
    .sort((a, b) => b.solvedAt!.getTime() - a.solvedAt!.getTime())
    .slice(0, 5)
    .map(serializeProblem);

  const nextDue = solved
    .filter((problem) => problem.dueAt !== null && problem.dueAt > todayEnd)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime())[0];

  return {
    totals: {
      total: problems.length,
      solved: solved.length,
      todo: problems.length - solved.length,
      dueToday: due.length,
      dueThisWeek: solved.filter(
        (problem) =>
          problem.dueAt !== null &&
          problem.dueAt > todayEnd &&
          problem.dueAt <= weekEnd
      ).length,
      reviewsToday: counts.get(toDateKey(todayStart)) ?? 0,
      reviews7d: logs.filter((log) => log.reviewedAt.getTime() >= sevenDaysAgo)
        .length,
      reviews30d: logs.filter(
        (log) => log.reviewedAt.getTime() >= thirtyDaysAgo
      ).length,
      streak,
    },
    difficulty,
    topics: [...topicCount.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    heatmap,
    activity,
    due: due.slice(0, 5).map(serializeProblem),
    recent,
    nextDueAt: nextDue?.dueAt?.toISOString() ?? null,
  };
}
