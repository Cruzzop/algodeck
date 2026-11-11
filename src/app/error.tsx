"use client";

import Link from "next/link";
import { AlertIcon } from "@/components/icons";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-16">
      <EmptyState
        icon={AlertIcon}
        title="Something went wrong"
        description={
          error.message ||
          "An unexpected error occurred while rendering this page."
        }
      >
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClass({ variant: "secondary" })}>
          Back to dashboard
        </Link>
      </EmptyState>
    </div>
  );
}
