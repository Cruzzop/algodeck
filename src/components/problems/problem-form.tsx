"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import {
  DIFFICULTIES,
  PLATFORMS,
  STATUSES,
  TOPIC_SUGGESTIONS,
  type Difficulty,
  type Status,
} from "@/lib/constants";
import type { ProblemDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

type FormState = {
  title: string;
  url: string;
  platform: string;
  difficulty: Difficulty;
  status: Status;
  topicsText: string;
  notes: string;
  solution: string;
  timeSpent: string;
};

const EMPTY: FormState = {
  title: "",
  url: "",
  platform: "LeetCode",
  difficulty: "MEDIUM",
  status: "TODO",
  topicsText: "",
  notes: "",
  solution: "",
  timeSpent: "",
};

export function ProblemForm({
  open,
  onOpenChange,
  problem,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: ProblemDTO | null;
  onSaved: (problem: ProblemDTO) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (problem) {
      setForm({
        title: problem.title,
        url: problem.url ?? "",
        platform: problem.platform,
        difficulty: problem.difficulty,
        status: problem.status,
        topicsText: problem.topics.join(", "),
        notes: problem.notes ?? "",
        solution: problem.solution ?? "",
        timeSpent: problem.timeSpentMin ? String(problem.timeSpentMin) : "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, problem]);

  const topics = useMemo(
    () =>
      form.topicsText
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
    [form.topicsText]
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function toggleTopic(topic: string) {
    const exists = topics.some(
      (item) => item.toLowerCase() === topic.toLowerCase()
    );
    const next = exists
      ? topics.filter((item) => item.toLowerCase() !== topic.toLowerCase())
      : [...topics, topic];
    set("topicsText", next.join(", "));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Give the problem a title first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        problem ? `/api/problems/${problem.id}` : "/api/problems",
        {
          method: problem ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            url: form.url.trim(),
            platform: form.platform,
            difficulty: form.difficulty,
            status: form.status,
            topics,
            notes: form.notes,
            solution: form.solution,
            timeSpentMin: Number(form.timeSpent) || 0,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save the problem.");
      }

      onSaved(data.problem as ProblemDTO);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={problem ? "Edit problem" : "Add a problem"}
      description={
        problem
          ? "Update notes, solution or review settings."
          : "Log a problem you have solved or want to solve later."
      }
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="problem-form" disabled={saving}>
            {saving ? "Saving…" : problem ? "Save changes" : "Add problem"}
          </Button>
        </div>
      }
    >
      <form id="problem-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-200">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Title" hint="required">
          <Input
            autoFocus
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="e.g. Trapping Rain Water"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Problem URL" hint="optional">
            <Input
              type="url"
              value={form.url}
              onChange={(event) => set("url", event.target.value)}
              placeholder="https://leetcode.com/problems/…"
            />
          </Field>
          <Field label="Platform">
            <Select
              value={form.platform}
              onChange={(event) => set("platform", event.target.value)}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Difficulty">
            <Segmented
              value={form.difficulty}
              onChange={(value) => set("difficulty", value)}
              options={DIFFICULTIES}
            />
          </Field>
          <Field label="Status">
            <Segmented
              value={form.status}
              onChange={(value) => set("status", value)}
              options={STATUSES}
            />
          </Field>
        </div>

        <Field label="Topics" hint="comma separated">
          <Input
            value={form.topicsText}
            onChange={(event) => set("topicsText", event.target.value)}
            placeholder="Array, Two Pointers"
          />
          <div className="mt-2 flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto">
            {TOPIC_SUGGESTIONS.map((topic) => {
              const active = topics.some(
                (item) => item.toLowerCase() === topic.toLowerCase()
              );
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset transition-colors",
                    active
                      ? "bg-indigo-500/15 text-indigo-200 ring-indigo-400/30"
                      : "bg-white/[0.03] text-zinc-500 ring-white/[0.07] hover:text-zinc-300"
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Time spent" hint="minutes">
          <Input
            type="number"
            min={0}
            className="max-w-[160px]"
            value={form.timeSpent}
            onChange={(event) => set("timeSpent", event.target.value)}
            placeholder="25"
          />
        </Field>

        <Field label="Notes" hint="key idea, edge cases, mistakes">
          <Textarea
            rows={4}
            value={form.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Hash map of value → index. Check for duplicates before inserting…"
          />
        </Field>

        <Field label="Solution" hint="optional">
          <Textarea
            rows={6}
            value={form.solution}
            onChange={(event) => set("solution", event.target.value)}
            placeholder="Paste your accepted solution here…"
            className="font-mono text-xs"
          />
        </Field>
      </form>
    </Modal>
  );
}
