import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { endOfDay } from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: "AlgoDeck — DSA tracker with spaced repetition",
    template: "%s · AlgoDeck",
  },
  description:
    "Track DSA problems, take notes, save solutions and review them with spaced repetition so nothing you solve is ever forgotten.",
  keywords: [
    "DSA tracker",
    "spaced repetition",
    "leetcode tracker",
    "nextjs",
    "prisma",
    "sqlite",
  ],
  authors: [{ name: "AlgoDeck" }],
};

export const viewport: Viewport = {
  themeColor: "#07070b",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let dueCount = 0;
  try {
    dueCount = await db.problem.count({
      where: { status: "SOLVED", dueAt: { lte: endOfDay(new Date()) } },
    });
  } catch {
    // The table may not exist yet on a fresh clone. The shell still renders.
  }

  return (
    <html lang="en">
      <body>
        <AppShell dueCount={dueCount}>{children}</AppShell>
      </body>
    </html>
  );
}
