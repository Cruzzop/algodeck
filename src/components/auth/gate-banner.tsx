"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon, UnlockIcon } from "@/components/icons";

/**
 * Slim status strip shown only when the demo gate is active: amber while the
 * visitor is read-only, emerald once they have unlocked editing.
 */
export function GateBanner({
  enabled,
  unlocked,
}: {
  enabled: boolean;
  unlocked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  async function lock() {
    setBusy(true);
    await fetch("/api/unlock", { method: "DELETE" }).catch(() => null);
    setBusy(false);
    router.refresh();
  }

  if (unlocked) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs text-emerald-200/80">
          <UnlockIcon className="size-3.5 shrink-0" />
          Editing unlocked — changes save to the database.
        </p>
        <button
          type="button"
          onClick={lock}
          disabled={busy}
          className="text-xs text-emerald-300/70 transition-colors hover:text-emerald-200 disabled:opacity-50"
        >
          {busy ? "Locking…" : "Lock again"}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-2.5">
      <p className="flex items-center gap-2 text-xs text-amber-200/80">
        <LockIcon className="size-3.5 shrink-0" />
        Read-only demo — browse everything freely, editing is locked.
      </p>
      <Link
        href="/unlock"
        className="text-xs font-medium text-amber-200 underline-offset-2 transition-colors hover:underline"
      >
        Unlock
      </Link>
    </div>
  );
}
