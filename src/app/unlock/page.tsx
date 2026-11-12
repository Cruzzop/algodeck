import Link from "next/link";
import { redirect } from "next/navigation";
import { gateState } from "@/lib/auth";
import { UnlockForm } from "@/components/auth/unlock-form";
import { ArrowLeftIcon, CodeIcon, LockIcon } from "@/components/icons";
import { panel } from "@/lib/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unlock editing",
};

export default async function UnlockPage() {
  const gate = await gateState();
  if (!gate.enabled || gate.unlocked) redirect("/");

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className={cn(panel, "p-6 sm:p-8")}>
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20">
          <LockIcon className="size-6" />
        </div>

        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight text-white">
          Unlock editing
        </h1>
        <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-relaxed text-zinc-500">
          This deployment is a read-only demo. Enter the demo password to make
          changes — the setting lives in the <code>DEMO_PASSWORD</code> env var.
        </p>

        <div className="mt-6">
          <UnlockForm />
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to browsing
        </Link>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-700">
        <CodeIcon className="size-3.5" />
        AlgoDeck — read-only demo mode
      </p>
    </div>
  );
}
