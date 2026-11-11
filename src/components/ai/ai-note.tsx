import { SparklesIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function AiNote({
  model,
  className,
}: {
  model?: string | null;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[10px] leading-relaxed text-zinc-600",
        className
      )}
    >
      <SparklesIcon className="size-3 shrink-0" />
      <span
        className="min-w-0 truncate"
        title={
          model
            ? `Model: ${model}`
            : "Free OpenRouter models with automatic fallback"
        }
      >
        Free AI
        {model ? (
          <span className="text-zinc-500"> · {model}</span>
        ) : (
          " · swaps models automatically"
        )}
      </span>
    </p>
  );
}
