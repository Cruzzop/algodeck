import { cn } from "@/lib/cn";

const LEVELS = [
  "bg-white/[0.04]",
  "bg-indigo-500/25",
  "bg-indigo-500/45",
  "bg-indigo-500/70",
  "bg-indigo-400",
];

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function ActivityHeatmap({
  days,
}: {
  days: { date: string; count: number; future: boolean }[];
}) {
  const weeks: (typeof days)[] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const monthLabels = weeks.map((week, index) => {
    const label = new Date(`${week[0].date}T00:00:00`).toLocaleDateString(
      "en-US",
      { month: "short" }
    );
    if (index === 0) return label;
    const previous = new Date(
      `${weeks[index - 1][0].date}T00:00:00`
    ).toLocaleDateString("en-US", { month: "short" });
    return previous === label ? "" : label;
  });

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[630px]">
          <div className="mb-1.5 flex gap-1.5 text-[9px] leading-none text-zinc-600">
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="w-[18px] shrink-0 whitespace-nowrap"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1.5">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex w-[18px] shrink-0 flex-col gap-1.5"
              >
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={
                      day.future
                        ? day.date
                        : `${day.count} ${day.count === 1 ? "review" : "reviews"} · ${day.date}`
                    }
                    className={cn(
                      "size-[18px] rounded-[3px] transition-colors",
                      day.future
                        ? "bg-transparent"
                        : LEVELS[levelFor(day.count)]
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-zinc-600">
        <span className="mr-1">Less</span>
        {LEVELS.map((className, index) => (
          <span
            key={index}
            className={cn("size-2.5 rounded-[2px]", className)}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  );
}
