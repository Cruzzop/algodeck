import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={SearchIcon}
        title="Page not found"
        description="The page or problem you are looking for does not exist, or it was deleted."
      >
        <Link href="/" className={buttonClass()}>
          Back to dashboard
        </Link>
      </EmptyState>
    </div>
  );
}
