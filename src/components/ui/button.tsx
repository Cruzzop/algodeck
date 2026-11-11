import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 active:bg-indigo-600",
  secondary:
    "border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
  ghost: "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
  danger:
    "border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "size-9",
};

export function buttonClass(
  options: { variant?: Variant; size?: Size; className?: string } = {}
): string {
  const { variant = "primary", size = "md", className } = options;
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}
