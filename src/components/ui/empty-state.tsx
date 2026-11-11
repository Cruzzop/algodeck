import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-14 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-xl bg-white/[0.04] text-zinc-500 ring-1 ring-inset ring-white/10">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">
        {description}
      </p>
      {children && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
