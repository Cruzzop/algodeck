export const DIFFICULTIES = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export const STATUSES = [
  { value: "TODO", label: "To do" },
  { value: "SOLVED", label: "Solved" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export const PLATFORMS = [
  "LeetCode",
  "Codeforces",
  "GeeksforGeeks",
  "HackerRank",
  "CodeChef",
  "Other",
] as const;

export const TOPIC_SUGGESTIONS = [
  "Array",
  "String",
  "Hash Table",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Stack",
  "Queue",
  "Linked List",
  "Tree",
  "Graph",
  "Heap",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
  "Recursion",
  "Sorting",
  "Trie",
  "Union Find",
  "Bit Manipulation",
  "Matrix",
  "Design",
];

export const DIFFICULTY_STYLES: Record<
  Difficulty,
  { label: string; badge: string; dot: string; bar: string; text: string }
> = {
  EASY: {
    label: "Easy",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
    text: "text-emerald-300",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    text: "text-amber-300",
  },
  HARD: {
    label: "Hard",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
    dot: "bg-rose-400",
    bar: "bg-rose-400",
    text: "text-rose-300",
  },
};

export const GITHUB_URL = "https://github.com/Cruzzop";
