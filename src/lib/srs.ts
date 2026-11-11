import { addDays, intervalLabel, startOfDay } from "./format";

export type Rating = 0 | 1 | 2 | 3;

export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
};

export type SrsResult = SrsState & { dueAt: Date };

export const RATINGS = [
  {
    value: 0 as Rating,
    label: "Again",
    hint: "1",
    description: "Forgot it",
    className:
      "border-rose-500/20 bg-rose-500/[0.07] text-rose-300 hover:bg-rose-500/15 hover:border-rose-400/40",
  },
  {
    value: 1 as Rating,
    label: "Hard",
    hint: "2",
    description: "Struggled",
    className:
      "border-amber-500/20 bg-amber-500/[0.07] text-amber-300 hover:bg-amber-500/15 hover:border-amber-400/40",
  },
  {
    value: 2 as Rating,
    label: "Good",
    hint: "3",
    description: "Got it",
    className:
      "border-indigo-500/25 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400/50",
  },
  {
    value: 3 as Rating,
    label: "Easy",
    hint: "4",
    description: "Too easy",
    className:
      "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-400/40",
  },
] as const;

const MIN_EASE = 1.3;
const MAX_EASE = 2.9;
const MAX_INTERVAL = 365;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * SM-2 inspired scheduler. "Again" sends the card back in 10 minutes,
 * every other rating pushes it out by a growing interval.
 */
export function scheduleReview(
  state: SrsState,
  rating: Rating,
  now: Date = new Date()
): SrsResult {
  let ease = clamp(state.ease, MIN_EASE, MAX_EASE);
  let repetitions = state.repetitions;
  let interval: number;

  if (rating === 0) {
    repetitions = 0;
    interval = 0;
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
  } else {
    if (rating === 1) ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
    if (rating === 3) ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);

    const multiplier =
      rating === 1 ? 1.2 : rating === 3 ? ease * 1.3 : ease;

    if (repetitions === 0) {
      interval = rating === 3 ? 2 : 1;
    } else if (repetitions === 1) {
      interval = rating === 1 ? 2 : rating === 3 ? 4 : 3;
    } else {
      interval = Math.max(1, state.intervalDays) * multiplier;
    }

    interval = clamp(Math.round(interval), 1, MAX_INTERVAL);
    repetitions += 1;
  }

  const dueAt =
    interval === 0
      ? new Date(now.getTime() + 10 * 60_000)
      : addDays(startOfDay(now), interval);

  return { ease: Math.round(ease * 100) / 100, intervalDays: interval, repetitions, dueAt };
}

/** Human-readable next interval for each rating button. */
export function previewSchedule(state: SrsState): { value: Rating; interval: string }[] {
  return RATINGS.map((rating) => {
    const result = scheduleReview(state, rating.value);
    return { value: rating.value, interval: intervalLabel(result.intervalDays) };
  });
}
