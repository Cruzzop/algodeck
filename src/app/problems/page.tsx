import { db } from "@/lib/db";
import { serializeProblem } from "@/lib/serialize";
import { isReadOnly } from "@/lib/auth";
import { ProblemsClient } from "@/components/problems/problems-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Problems",
};

export default async function ProblemsPage() {
  const [problems, readOnly] = await Promise.all([
    db.problem.findMany({ orderBy: { updatedAt: "desc" } }),
    isReadOnly(),
  ]);

  return (
    <ProblemsClient
      initialProblems={problems.map(serializeProblem)}
      readOnly={readOnly}
    />
  );
}
