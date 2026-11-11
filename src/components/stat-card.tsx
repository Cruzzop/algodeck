import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/cn";

type Accent = "indigo" | "emerald" | "amber" | "rose" | "fuchsia";

const ACCENTS: Record<Accent, { icon: string; glow: string }> = {
  indigo: {
    icon: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20",
    glow: "from-indigo-500/[0.07]",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
    glow: "from-emerald-500/[0.07]",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    glow: "from-amber-500/[0.07]",
  },
  rose: {
    icon: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
    glow: "from-rose-500/[0.07]",
  },
  fuchsia: {
    icon: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-400/20",
    glow: "from-fuchsia-500/[0.07]",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "indigo",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  hint: string;
  accent?: Accent;
}) {
  const style = ACCENTS[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12]">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          style.glow
        )}
      />
      <div className="relative flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg ring-1 ring-inset",
            style.icon
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="relative mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
