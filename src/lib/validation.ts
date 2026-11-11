import { z } from "zod";

export const createProblemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .or(z.literal(""))
    .optional(),
  platform: z.string().trim().min(1).max(40).default("LeetCode"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  status: z.enum(["TODO", "SOLVED"]).default("TODO"),
  topics: z
    .array(z.string().trim().min(1).max(40))
    .max(12, "Use at most 12 topics")
    .default([]),
  notes: z.string().max(20_000).optional(),
  solution: z.string().max(20_000).optional(),
  timeSpentMin: z.coerce.number().int().min(0).max(100_000).default(0),
});

export const updateProblemSchema = createProblemSchema.partial();

export const reviewSchema = z.object({
  rating: z.number().int().min(0).max(3),
});

export const aiHintRequestSchema = z.object({
  problemId: z.string().min(1),
  stage: z.coerce.number().int().min(1).max(3).default(1),
});

export const aiProblemRequestSchema = z.object({
  problemId: z.string().min(1),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
