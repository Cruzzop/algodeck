"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertIcon, LockIcon } from "@/components/icons";

export function UnlockForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || password.length === 0) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not unlock. Try again.");
      }

      router.push("/");
      router.refresh();
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : "Something went wrong."
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Demo password"
        autoFocus
        autoComplete="current-password"
      />
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={busy || password.length === 0}
        className="w-full"
      >
        <LockIcon className="size-4" />
        {busy ? "Checking…" : "Unlock editing"}
      </Button>
    </form>
  );
}
