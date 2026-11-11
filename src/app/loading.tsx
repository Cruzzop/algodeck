export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/[0.05]" />
        <div className="h-3 w-72 animate-pulse rounded bg-white/[0.03]" />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[124px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
      </div>
    </div>
  );
}
