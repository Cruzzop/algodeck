export function TopicBars({
  topics,
}: {
  topics: { topic: string; count: number }[];
}) {
  if (topics.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-zinc-600">
        Solve a few problems and your strongest topics will show up here.
      </p>
    );
  }

  const max = Math.max(...topics.map((topic) => topic.count));

  return (
    <div className="space-y-3.5">
      {topics.map((topic, index) => (
        <div key={topic.topic}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-zinc-400">{topic.topic}</span>
            <span className="tabular-nums text-zinc-600">{topic.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
              style={{
                width: `${(topic.count / max) * 100}%`,
                opacity: 1 - index * 0.08,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
