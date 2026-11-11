import type { Problem, ReviewLog } from "@prisma/client";
import type { Difficulty, Status } from "./constants";
import type { ProblemDTO, ReviewDTO } from "./types";

export function parseTopics(topics: string): string[] {
  return topics
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
}

export function joinTopics(topics: string[]): string {
  return topics
    .map((topic) => topic.trim())
    .filter(Boolean)
    .join(", ");
}

export function serializeProblem(problem: Problem): ProblemDTO {
  return {
    ...problem,
    difficulty: problem.difficulty as Difficulty,
    status: problem.status as Status,
    topics: parseTopics(problem.topics),
    solvedAt: problem.solvedAt?.toISOString() ?? null,
    dueAt: problem.dueAt?.toISOString() ?? null,
    lastReviewedAt: problem.lastReviewedAt?.toISOString() ?? null,
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
  };
}

export function serializeReview(review: ReviewLog): ReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    reviewedAt: review.reviewedAt.toISOString(),
  };
}
