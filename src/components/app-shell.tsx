"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CodeIcon,
  DashboardIcon,
  GithubIcon,
  ListIcon,
  RepeatIcon,
} from "@/components/icons";
import { GateBanner } from "@/components/auth/gate-banner";
import { GITHUB_URL } from "@/lib/constants";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/problems", label: "Problems", icon: ListIcon },
  { href: "/review", label: "Review", icon: RepeatIcon },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
        <CodeIcon className="size-[18px] text-white" strokeWidth={2} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">
          AlgoDeck
        </span>
        <span className="block text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          DSA · spaced repetition
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  dueCount,
  gateEnabled,
  gateUnlocked,
  children,
}: {
  dueCount: number;
  gateEnabled: boolean;
  gateUnlocked: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.06] bg-[#09090e]/70 px-4 py-5 backdrop-blur-xl lg:flex">
        <Brand />

        <nav className="mt-8 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/[0.07] text-white ring-1 ring-inset ring-white/10"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] transition-colors",
                    active
                      ? "text-indigo-300"
                      : "text-zinc-600 group-hover:text-zinc-400"
                  )}
                />
                {item.label}
                {item.href === "/review" && dueCount > 0 && (
                  <span className="ml-auto rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                    {dueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-indigo-500/[0.09] to-fuchsia-500/[0.04] p-3.5">
            <p className="text-xs font-medium text-zinc-300">
              Beat the forgetting curve
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Review each problem right before it slips away. Small daily reps
              beat cramming.
            </p>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
          >
            <GithubIcon className="size-4" />
            View on GitHub
          </a>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08080c]/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          {dueCount > 0 && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
              {dueCount} due
            </span>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1180px] px-5 py-6 lg:px-10 lg:py-10">
          <GateBanner enabled={gateEnabled} unlocked={gateUnlocked} />
          {children}
        </div>
      </main>
    </div>
  );
}
