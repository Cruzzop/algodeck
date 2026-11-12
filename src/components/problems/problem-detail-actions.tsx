"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProblemForm } from "@/components/problems/problem-form";
import { Button, buttonClass } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toast, useToast } from "@/components/ui/toast";
import {
  AlertIcon,
  LockIcon,
  PencilIcon,
  RepeatIcon,
  TrashIcon,
} from "@/components/icons";
import type { ProblemDTO } from "@/lib/types";

export function ProblemDetailActions({
  problem,
  readOnly = false,
}: {
  problem: ProblemDTO;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { toast, show } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSaved() {
    setFormOpen(false);
    show("Problem updated.");
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete the problem.");
      }

      router.push("/problems");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong."
      );
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {problem.status === "SOLVED" && (
          <Link
            href="/review"
            className={buttonClass({ variant: "secondary" })}
          >
            <RepeatIcon className="size-4" />
            Review
          </Link>
        )}
        {readOnly ? (
          <Link href="/unlock" className={buttonClass({ variant: "secondary" })}>
            <LockIcon className="size-4" />
            Unlock editing
          </Link>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setFormOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete problem"
            >
              <TrashIcon className="size-4" />
            </Button>
          </>
        )}
      </div>

      {!readOnly && (
        <ProblemForm
          open={formOpen}
          onOpenChange={setFormOpen}
          problem={problem}
          onSaved={handleSaved}
        />
      )}

      {!readOnly && (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Delete this problem?"
          description="Its review history will be removed too. This cannot be undone."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={busy}>
                {busy ? "Deleting…" : "Delete problem"}
              </Button>
            </div>
          }
        >
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}
          <p className="text-sm leading-relaxed text-zinc-400">
            You are about to delete{" "}
            <span className="font-medium text-zinc-200">{problem.title}</span>.
          </p>
        </Modal>
      )}

      <Toast message={toast} />
    </>
  );
}
