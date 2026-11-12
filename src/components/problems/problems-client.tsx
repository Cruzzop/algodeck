"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { PageHeader } from "@/components/page-header";
import { ProblemForm } from "@/components/problems/problem-form";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast, useToast } from "@/components/ui/toast";
import {
  AlertIcon,
  CheckIcon,
  ExternalLinkIcon,
  ListIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { DIFFICULTY_STYLES, type Difficulty } from "@/lib/constants";
import { dueLabel, endOfDay, type DueTone } from "@/lib/format";
import type { ProblemDTO } from "@/lib/types";
import { panel } from "@/lib/ui";
import { cn } from "@/lib/cn";

type Filter = "ALL" | "TODO" | "SOLVED" | "DUE";
type Sort = "recent" | "newest" | "title" | "due" | "difficulty";

const TABS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To do" },
  { value: "SOLVED", label: "Solved" },
  { value: "DUE", label: "Due" },
];

const TONE: Record<DueTone, string> = {
  danger: "text-rose-300",
  warn: "text-amber-300",
  soon: "text-indigo-300",
  muted: "text-zinc-600",
};

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

function isDue(problem: ProblemDTO) {
  return (
    problem.status === "SOLVED" &&
    problem.dueAt !== null &&
    new Date(problem.dueAt).getTime() <= endOfDay(new Date()).getTime()
  );
}

export function ProblemsClient({
  initialProblems,
  readOnly = false,
}: {
  initialProblems: ProblemDTO[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { toast, show } = useToast();

  const [problems, setProblems] = useState(initialProblems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
  const [sort, setSort] = useState<Sort>("recent");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProblemDTO | null>(null);
  const [deleting, setDeleting] = useState<ProblemDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      ALL: problems.length,
      TODO: problems.filter((problem) => problem.status === "TODO").length,
      SOLVED: problems.filter((problem) => problem.status === "SOLVED").length,
      DUE: problems.filter(isDue).length,
    }),
    [problems]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = problems.filter((problem) => {
      if (filter === "TODO" && problem.status !== "TODO") return false;
      if (filter === "SOLVED" && problem.status !== "SOLVED") return false;
      if (filter === "DUE" && !isDue(problem)) return false;
      if (difficulty !== "ALL" && problem.difficulty !== difficulty) {
        return false;
      }
      if (needle) {
        const haystack = [
          problem.title,
          problem.platform,
          ...problem.topics,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return [...matches].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "newest") {
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      if (sort === "due") {
        const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return aDue - bDue;
      }
      if (sort === "difficulty") {
        return (
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
        );
      }
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
  }, [problems, query, filter, difficulty, sort]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(problem: ProblemDTO) {
    setEditing(problem);
    setFormOpen(true);
  }

  function resetFilters() {
    setQuery("");
    setFilter("ALL");
    setDifficulty("ALL");
  }

  function handleSaved(problem: ProblemDTO) {
    setProblems((previous) => {
      const exists = previous.some((item) => item.id === problem.id);
      return exists
        ? previous.map((item) => (item.id === problem.id ? problem : item))
        : [problem, ...previous];
    });
    setFormOpen(false);
    setEditing(null);
    show(editing ? "Problem updated." : "Problem added to your deck.");
    router.refresh();
  }

  async function toggleSolved(problem: ProblemDTO) {
    if (readOnly) {
      show("Read-only demo — unlock to record changes.");
      return;
    }

    const nextStatus = problem.status === "SOLVED" ? "TODO" : "SOLVED";

    setProblems((items) =>
      items.map((item) =>
        item.id === problem.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const response = await fetch(`/api/problems/${problem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not update the problem.");
      }

      setProblems((items) =>
        items.map((item) =>
          item.id === problem.id ? (data.problem as ProblemDTO) : item
        )
      );
      show(
        nextStatus === "SOLVED"
          ? "Solved! First review is scheduled for tomorrow."
          : "Moved back to to-do."
      );
      router.refresh();
    } catch {
      setProblems((items) =>
        items.map((item) => (item.id === problem.id ? problem : item))
      );
      show("Could not update the problem. Try again.");
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    setBusy(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/problems/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete the problem.");
      }

      setProblems((items) => items.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      show("Problem deleted.");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Problems"
        description={`${counts.ALL} tracked · ${counts.SOLVED} solved · ${counts.DUE} due for review`}
        actions={
          readOnly ? (
            <Link href="/unlock" className={buttonClass({ variant: "secondary" })}>
              <LockIcon className="size-4" />
              Unlock editing
            </Link>
          ) : (
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Add problem
            </Button>
          )
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, topic or platform…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 sm:flex-none">
              <Select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty | "ALL")
                }
                className="w-full sm:w-[150px]"
              >
                <option value="ALL">All difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </div>
            <div className="flex-1 sm:flex-none">
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="w-full sm:w-[170px]"
              >
                <option value="recent">Recently updated</option>
                <option value="newest">Newest first</option>
                <option value="title">Title A–Z</option>
                <option value="due">Due soonest</option>
                <option value="difficulty">Difficulty</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === tab.value
                  ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"
                  : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              )}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums text-zinc-600">
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {problems.length === 0 ? (
        <EmptyState
          icon={ListIcon}
          title="Your deck is empty"
          description="Add the first problem you have solved, or load the demo data with `npm run db:seed`."
        >
          {readOnly ? (
            <Link href="/unlock" className={buttonClass({ variant: "secondary" })}>
              <LockIcon className="size-4" />
              Unlock editing
            </Link>
          ) : (
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Add your first problem
            </Button>
          )}
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No problems match"
          description="Try a different search, difficulty or status filter."
        >
          <Button variant="secondary" onClick={resetFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <div className={cn(panel, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                  <th className="w-10 py-3 pl-4" />
                  <th className="py-3 pr-4 font-medium">Problem</th>
                  <th className="py-3 pr-4 font-medium">Difficulty</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">
                    Topics
                  </th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">
                    Next review
                  </th>
                  {!readOnly && (
                    <th className="w-[86px] py-3 pr-4 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((problem) => {
                  const due =
                    problem.status === "SOLVED"
                      ? dueLabel(problem.dueAt)
                      : { text: "—", tone: "muted" as DueTone };

                  return (
                    <tr
                      key={problem.id}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3 pl-4 pr-1 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSolved(problem)}
                          aria-label={
                            problem.status === "SOLVED"
                              ? "Mark as to do"
                              : "Mark as solved"
                          }
                          title={
                            problem.status === "SOLVED"
                              ? "Mark as to do"
                              : "Mark as solved"
                          }
                          className={cn(
                            "grid size-5 place-items-center rounded-full border transition-colors",
                            problem.status === "SOLVED"
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                              : "border-white/15 text-transparent hover:border-white/35"
                          )}
                        >
                          <CheckIcon className="size-3" strokeWidth={2.4} />
                        </button>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/problems/${problem.id}`}
                            className="block max-w-[170px] truncate font-medium text-zinc-200 transition-colors hover:text-white sm:max-w-[300px]"
                          >
                            {problem.title}
                          </Link>
                          {problem.url && (
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open problem"
                              className="shrink-0 text-zinc-600 transition-colors hover:text-indigo-300"
                            >
                              <ExternalLinkIcon className="size-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-600">
                          <span>{problem.platform}</span>
                          {problem.timeSpentMin > 0 && (
                            <>
                              <span>·</span>
                              <span>{problem.timeSpentMin}m</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 pr-4">
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </td>

                      <td className="hidden max-w-[230px] py-3 pr-4 lg:table-cell">
                        {problem.topics.length === 0 ? (
                          <span className="text-[11px] text-zinc-700">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {problem.topics.slice(0, 3).map((topic) => (
                              <span
                                key={topic}
                                className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]"
                              >
                                {topic}
                              </span>
                            ))}
                            {problem.topics.length > 3 && (
                              <span className="px-1 text-[10px] text-zinc-600">
                                +{problem.topics.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="hidden py-3 pr-4 md:table-cell">
                        <span className={cn("text-xs", TONE[due.tone])}>
                          {due.text}
                        </span>
                      </td>

                      {!readOnly && (
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(problem)}
                              aria-label="Edit problem"
                              className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(problem);
                              }}
                              aria-label="Delete problem"
                              className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProblemForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        problem={editing}
        onSaved={handleSaved}
      />

      <Modal
        open={deleting !== null}
        onClose={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
        title="Delete this problem?"
        description="Its review history will be removed too. This cannot be undone."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete problem"}
            </Button>
          </div>
        }
      >
        {deleteError && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            {deleteError}
          </div>
        )}
        <p className="text-sm leading-relaxed text-zinc-400">
          You are about to delete{" "}
          <span className="font-medium text-zinc-200">{deleting?.title}</span>.
        </p>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}
