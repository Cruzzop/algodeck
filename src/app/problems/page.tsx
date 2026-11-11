import { db } from "@/lib/db";
import { serializeProblem } from "@/lib/serialize";
import { ProblemsClient } from "@/components/problems/problems-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Problems",
};

export default async function ProblemsPage() {
  const problems = await db.problem.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ProblemsClient initialProblems={problems.map(serializeProblem)} />
  );
}
