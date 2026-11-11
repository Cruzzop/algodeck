import { z } from "zod";
import type {
  AiCoachReport,
  AiExplanation,
  ChatMessage,
} from "./types";
import type { DashboardData } from "@/lib/types";

const explanationSchema = z.object({
  summary: z.string().catch("").default(""),
  pattern: z.string().catch("").default(""),
  timeComplexity: z.string().catch("").default(""),
  spaceComplexity: z.string().catch("").default(""),
  steps: z.array(z.string()).catch([]).default([]),
  edgeCases: z.array(z.string()).catch([]).default([]),
  interviewTip: z.string().catch("").default(""),
});

const coachSchema = z.object({
  headline: z.string().catch("").default(""),
  assessment: z.string().catch("").default(""),
  focus: z.string().catch("").default(""),
  why: z.string().catch("").default(""),
  plan: z.array(z.string()).catch([]).default([]),
});

/** Tolerant JSON extraction for models that wrap JSON in prose or fences. */
export function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseExplanation(text: string): AiExplanation | null {
  const parsed = explanationSchema.safeParse(parseJsonObject(text));
  if (!parsed.success) return null;
  return parsed.data.summary ? parsed.data : null;
}

export function parseCoachReport(text: string): AiCoachReport | null {
  const parsed = coachSchema.safeParse(parseJsonObject(text));
  if (!parsed.success) return null;
  const report = parsed.data;
  return report.assessment || report.plan.length > 0 ? report : null;
}

export function hintMessages(
  problem: {
    title: string;
    platform: string;
    difficulty: string;
    topics: string[];
  },
  stage: number
): ChatMessage[] {
  const level =
    stage <= 1
      ? "Give a gentle nudge. Point at the key observation or pattern without naming the exact data structure if you can avoid it."
      : stage === 2
        ? "Give a stronger hint. Name the pattern or data structure to use and briefly explain why it fits."
        : "Give a detailed outline of the approach and its complexity, but do not write the final code.";

  return [
    {
      role: "system",
      content:
        "You are a concise DSA tutor. The student is trying to recall a problem from memory. Never reveal the full solution, final code, or the entire algorithm in one go. Be encouraging and specific. Return plain text only — no markdown headings, no code fences, and no preamble like 'Hint:'.",
    },
    {
      role: "user",
      content: `Problem: ${problem.title}
Platform: ${problem.platform}
Difficulty: ${problem.difficulty}
Topics: ${problem.topics.length > 0 ? problem.topics.join(", ") : "unknown"}

${level}

Write 2-4 sentences. End with one short guiding question.`,
    },
  ];
}

export function explainMessages(problem: {
  title: string;
  platform: string;
  difficulty: string;
  topics: string[];
  notes: string | null;
  solution: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a senior software engineer helping a student turn an accepted DSA solution into a revision note. Respond with JSON only. Do not wrap it in markdown fences and do not add any text outside the JSON object.",
    },
    {
      role: "user",
      content: `Problem: ${problem.title}
Platform: ${problem.platform}
Difficulty: ${problem.difficulty}
Topics: ${problem.topics.length > 0 ? problem.topics.join(", ") : "unknown"}
Student notes: ${problem.notes?.slice(0, 2000) || "none"}

Solution:
${problem.solution.slice(0, 6000)}

Return exactly this shape:
{
  "summary": "2-3 sentences explaining the core idea in plain English",
  "pattern": "the algorithm or pattern name, e.g. Sliding window",
  "timeComplexity": "e.g. O(n)",
  "spaceComplexity": "e.g. O(1)",
  "steps": ["3-5 short steps describing how the solution works"],
  "edgeCases": ["2-4 edge cases worth remembering"],
  "interviewTip": "one sentence of practical interview advice"
}

Do not invent constraints that are not supported by the solution. If the code is incomplete, explain what is present and note what is missing.`,
    },
  ];
}

export function coachMessages(data: DashboardData): ChatMessage[] {
  const difficulty = data.difficulty
    .map((item) => `${item.label} ${item.solved}/${item.total} solved`)
    .join(", ");
  const topics = data.topics
    .map((item) => `${item.topic} (${item.count})`)
    .join(", ");
  const due = data.due.map((problem) => problem.title).join("; ");

  return [
    {
      role: "system",
      content:
        "You are a pragmatic DSA coach. Analyse the student's tracker data and give specific, encouraging advice. Respond with JSON only. Do not wrap it in markdown fences and do not add any text outside the JSON object. Do not invent data that is not provided.",
    },
    {
      role: "user",
      content: `Tracker data:
- Problems tracked: ${data.totals.total}; solved: ${data.totals.solved}; to do: ${data.totals.todo}
- Due today: ${data.totals.dueToday}; due in the next 7 days: ${data.totals.dueThisWeek}
- Review streak: ${data.totals.streak} days
- Reviews today: ${data.totals.reviewsToday}; last 7 days: ${data.totals.reviews7d}; last 30 days: ${data.totals.reviews30d}
- Difficulty split: ${difficulty || "no problems yet"}
- Solved topics: ${topics || "none yet"}
- Due now: ${due || "nothing"}

Return exactly this shape:
{
  "headline": "a short, specific headline (max 8 words)",
  "assessment": "2 sentences summarising the current state",
  "focus": "the single most useful topic or skill to focus on next",
  "why": "one sentence explaining why this matters now",
  "plan": ["3 concrete actions for the next 3 days"]
}

Be honest but encouraging. Base every claim on the numbers above.`,
    },
  ];
}
