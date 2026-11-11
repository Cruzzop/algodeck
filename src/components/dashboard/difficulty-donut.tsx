const COLORS: Record<string, string> = {
  EASY: "#34d399",
  MEDIUM: "#fbbf24",
  HARD: "#fb7185",
};

export function DifficultyDonut({
  data,
}: {
  data: { key: string; label: string; total: number; solved: number }[];
}) {
  const solvedTotal = data.reduce((sum, item) => sum + item.solved, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-[128px] shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="9"
          />
          {solvedTotal > 0 &&
            data.map((item) => {
              const length = (item.solved / solvedTotal) * circumference;
              const dashOffset = -offset;
              offset += length;
              return (
                <circle
                  key={item.key}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={COLORS[item.key]}
                  strokeWidth="9"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-white">
            {solvedTotal}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
            solved
          </span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {data.map((item) => (
          <div key={item.key} className="flex items-center gap-2.5 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[item.key] }}
            />
            <span className="flex-1 text-zinc-400">{item.label}</span>
            <span className="tabular-nums text-zinc-600">
              <span className="text-zinc-200">{item.solved}</span> /{" "}
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
