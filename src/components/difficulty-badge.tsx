import { DIFFICULTY_STYLES, type Difficulty } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  const style = DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.MEDIUM;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        style.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
