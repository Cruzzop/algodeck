import type { Difficulty, Status } from "./constants";

export type ProblemDTO = {
  id: string;
  title: string;
  url: string | null;
  platform: string;
  difficulty: Difficulty;
  status: Status;
  topics: string[];
  notes: string | null;
  solution: string | null;
  timeSpentMin: number;
  solvedAt: string | null;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewDTO = {
  id: string;
  rating: number;
  reviewedAt: string;
};

export type ProblemWithReviewsDTO = ProblemDTO & {
  reviews: ReviewDTO[];
};

export type DashboardData = {
  totals: {
    total: number;
    solved: number;
    todo: number;
    dueToday: number;
    dueThisWeek: number;
    reviewsToday: number;
    reviews7d: number;
    reviews30d: number;
    streak: number;
  };
  difficulty: {
    key: Difficulty;
    label: string;
    total: number;
    solved: number;
  }[];
  topics: { topic: string; count: number }[];
  heatmap: { date: string; count: number; future: boolean }[];
  activity: { label: string; date: string; count: number }[];
  due: ProblemDTO[];
  recent: ProblemDTO[];
  nextDueAt: string | null;
};
