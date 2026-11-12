// Demo data for AlgoDeck.
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Load .env so a plain `node prisma/seed.mjs` sees DATABASE_URL / Turso vars
// before the client is created.
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[m[1]] = value;
  }
} catch {
  // No .env file — fall back to real environment variables.
}

// Turso env vars switch the seed to the hosted libSQL database; otherwise the
// local SQLite file is used.
async function makePrisma() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!tursoUrl) return new PrismaClient();

  const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
  const adapter = new PrismaLibSQL({
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  });
  return new PrismaClient({ adapter });
}

const prisma = await makePrisma();

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const today = startOfDay(new Date());

const problems = [
  {
    title: "Two Sum",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Array, Hash Table",
    url: "https://leetcode.com/problems/two-sum/",
    timeSpentMin: 12,
    solvedDaysAgo: 21,
    dueInDays: 4,
    ease: 2.6,
    repetitions: 4,
    intervalDays: 11,
    notes:
      "One pass with a hash map. For each number check whether `target - num` is already stored, then save `num -> index`.",
    solution: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []`,
  },
  {
    title: "Valid Parentheses",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Stack, String",
    url: "https://leetcode.com/problems/valid-parentheses/",
    timeSpentMin: 15,
    solvedDaysAgo: 19,
    dueInDays: 0,
    ease: 2.45,
    repetitions: 5,
    intervalDays: 8,
    notes:
      "Push opening brackets. A closing bracket must match the stack top. The stack has to be empty at the end.",
    solution: `def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for char in s:
        if char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
        else:
            stack.append(char)
    return not stack`,
  },
  {
    title: "Merge Two Sorted Lists",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Linked List, Recursion",
    url: "https://leetcode.com/problems/merge-two-sorted-lists/",
    timeSpentMin: 20,
    solvedDaysAgo: 18,
    dueInDays: 2,
    ease: 2.55,
    repetitions: 3,
    intervalDays: 6,
    notes:
      "Dummy head + tail pointer. Attach the smaller node each step, then append the leftover list.",
    solution: `def merge_two_lists(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next`,
  },
  {
    title: "Best Time to Buy and Sell Stock",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Array, Dynamic Programming, Greedy",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    timeSpentMin: 10,
    solvedDaysAgo: 17,
    dueInDays: -1,
    ease: 2.35,
    repetitions: 4,
    intervalDays: 7,
    notes:
      "Track the cheapest price so far and the best profit. One pass, O(1) extra space.",
    solution: `def max_profit(prices):
    best = 0
    low = float("inf")
    for price in prices:
        low = min(low, price)
        best = max(best, price - low)
    return best`,
  },
  {
    title: "Binary Search",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Binary Search, Array",
    url: "https://leetcode.com/problems/binary-search/",
    timeSpentMin: 8,
    solvedDaysAgo: 16,
    dueInDays: 1,
    ease: 2.7,
    repetitions: 6,
    intervalDays: 14,
    notes:
      "Invariant: the answer is always inside [lo, hi]. Use `lo <= hi` so a single-element range is checked.",
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
  },
  {
    title: "Maximum Subarray",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Dynamic Programming, Divide and Conquer",
    url: "https://leetcode.com/problems/maximum-subarray/",
    timeSpentMin: 25,
    solvedDaysAgo: 15,
    dueInDays: 0,
    ease: 2.5,
    repetitions: 4,
    intervalDays: 9,
    notes:
      "Kadane's algorithm: either extend the previous subarray or start fresh at the current number.",
    solution: `def max_sub_array(nums):
    best = current = nums[0]
    for num in nums[1:]:
        current = max(num, current + num)
        best = max(best, current)
    return best`,
  },
  {
    title: "Climbing Stairs",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Dynamic Programming, Memoization",
    url: "https://leetcode.com/problems/climbing-stairs/",
    timeSpentMin: 9,
    solvedDaysAgo: 14,
    dueInDays: 4,
    ease: 2.6,
    repetitions: 3,
    intervalDays: 10,
    notes:
      "It is Fibonacci: ways(n) = ways(n-1) + ways(n-2). Only two previous values are needed.",
    solution: `def climb_stairs(n):
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a`,
  },
  {
    title: "Linked List Cycle",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "Linked List, Two Pointers",
    url: "https://leetcode.com/problems/linked-list-cycle/",
    timeSpentMin: 14,
    solvedDaysAgo: 13,
    dueInDays: 2,
    ease: 2.5,
    repetitions: 4,
    intervalDays: 8,
    notes:
      "Floyd's tortoise and hare. If there is a cycle, the fast pointer eventually meets the slow one.",
    solution: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
  },
  {
    title: "Longest Substring Without Repeating Characters",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "String, Sliding Window, Hash Table",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    timeSpentMin: 30,
    solvedDaysAgo: 12,
    dueInDays: 1,
    ease: 2.4,
    repetitions: 5,
    intervalDays: 7,
    notes:
      "Sliding window + last-seen index map. Move `left` past the previous occurrence of a repeated character.",
    solution: `def length_of_longest_substring(s):
    last = {}
    left = best = 0
    for right, char in enumerate(s):
        if char in last and last[char] >= left:
            left = last[char] + 1
        last[char] = right
        best = max(best, right - left + 1)
    return best`,
  },
  {
    title: "Container With Most Water",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Two Pointers, Greedy",
    url: "https://leetcode.com/problems/container-with-most-water/",
    timeSpentMin: 22,
    solvedDaysAgo: 11,
    dueInDays: 0,
    ease: 2.55,
    repetitions: 4,
    intervalDays: 9,
    notes:
      "Start with the widest container. Always move the shorter line inward — moving the taller one can never help.",
    solution: `def max_area(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        best = max(best, min(height[left], height[right]) * (right - left))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best`,
  },
  {
    title: "Valid Anagram",
    platform: "LeetCode",
    difficulty: "EASY",
    status: "SOLVED",
    topics: "String, Hash Table, Sorting",
    url: "https://leetcode.com/problems/valid-anagram/",
    timeSpentMin: 7,
    solvedDaysAgo: 10,
    dueInDays: 3,
    ease: 2.75,
    repetitions: 5,
    intervalDays: 12,
    notes:
      "Both strings must have identical character counts. Counter comparison is the shortest version.",
    solution: `from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)`,
  },
  {
    title: "Group Anagrams",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Hash Table, String, Sorting",
    url: "https://leetcode.com/problems/group-anagrams/",
    timeSpentMin: 26,
    solvedDaysAgo: 9,
    dueInDays: 0,
    ease: 2.45,
    repetitions: 4,
    intervalDays: 8,
    notes:
      "Use the sorted word as the group key. For large alphabets, a 26-count tuple is a faster key.",
    solution: `from collections import defaultdict

def group_anagrams(strs):
    groups = defaultdict(list)
    for word in strs:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())`,
  },
  {
    title: "Product of Array Except Self",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Prefix Sum",
    url: "https://leetcode.com/problems/product-of-array-except-self/",
    timeSpentMin: 24,
    solvedDaysAgo: 8,
    dueInDays: 2,
    ease: 2.5,
    repetitions: 3,
    intervalDays: 6,
    notes:
      "Prefix products in the result array, then a right-to-left suffix pass. No division needed.",
    solution: `def product_except_self(nums):
    result = [1] * len(nums)
    prefix = 1
    for i, num in enumerate(nums):
        result[i] = prefix
        prefix *= num
    suffix = 1
    for i in range(len(nums) - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result`,
  },
  {
    title: "3Sum",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Two Pointers, Sorting",
    url: "https://leetcode.com/problems/3sum/",
    timeSpentMin: 35,
    solvedDaysAgo: 7,
    dueInDays: 1,
    ease: 2.3,
    repetitions: 4,
    intervalDays: 7,
    notes:
      "Sort, fix one index, then two-pointer the rest. Skip duplicates at both the fixed index and after a match.",
    solution: `def three_sum(nums):
    nums.sort()
    result = []
    for i, num in enumerate(nums):
        if i > 0 and num == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = num + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([num, nums[left], nums[right]])
                left += 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return result`,
  },
  {
    title: "Merge Intervals",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Array, Sorting",
    url: "https://leetcode.com/problems/merge-intervals/",
    timeSpentMin: 28,
    solvedDaysAgo: 6,
    dueInDays: 0,
    ease: 2.4,
    repetitions: 3,
    intervalDays: 6,
    notes:
      "Sort by start. If the next interval starts before the last merged end, extend the end; otherwise append.",
    solution: `def merge(intervals):
    intervals.sort(key=lambda interval: interval[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
  },
  {
    title: "LRU Cache",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Hash Table, Linked List, Design",
    url: "https://leetcode.com/problems/lru-cache/",
    timeSpentMin: 45,
    solvedDaysAgo: 5,
    dueInDays: 5,
    ease: 2.2,
    repetitions: 2,
    intervalDays: 4,
    notes:
      "Hash map + doubly linked list gives O(1) get and put. Python's OrderedDict already does both.",
    solution: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = OrderedDict()

    def get(self, key):
        if key not in self.items:
            return -1
        self.items.move_to_end(key)
        return self.items[key]

    def put(self, key, value):
        if key in self.items:
            self.items.move_to_end(key)
        self.items[key] = value
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)`,
  },
  {
    title: "Course Schedule",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Graph, Topological Sort, DFS",
    url: "https://leetcode.com/problems/course-schedule/",
    timeSpentMin: 40,
    solvedDaysAgo: 4,
    dueInDays: 0,
    ease: 2.35,
    repetitions: 3,
    intervalDays: 5,
    notes:
      "Kahn's algorithm: start from nodes with indegree 0. If every node is processed, there is no cycle.",
    solution: `from collections import deque

def can_finish(num_courses, prerequisites):
    graph = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prerequisite in prerequisites:
        graph[prerequisite].append(course)
        indegree[course] += 1

    queue = deque(i for i in range(num_courses) if indegree[i] == 0)
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in graph[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    return visited == num_courses`,
  },
  {
    title: "Number of Islands",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Graph, BFS, DFS, Matrix",
    url: "https://leetcode.com/problems/number-of-islands/",
    timeSpentMin: 32,
    solvedDaysAgo: 3,
    dueInDays: 2,
    ease: 2.5,
    repetitions: 2,
    intervalDays: 4,
    notes:
      "Sink each island with DFS so it is counted once. Each cell is visited a constant number of times.",
    solution: `def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0

    def sink(r, c):
        if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count`,
  },
  {
    title: "Kth Largest Element in an Array",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Heap, Quickselect, Array",
    url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    timeSpentMin: 29,
    solvedDaysAgo: 2,
    dueInDays: 0,
    ease: 2.45,
    repetitions: 2,
    intervalDays: 3,
    notes:
      "A min-heap of size k keeps the k largest elements; the root is the answer. Quickselect is O(n) average.",
    solution: `import heapq

def find_kth_largest(nums, k):
    return heapq.nlargest(k, nums)[-1]`,
  },
  {
    title: "Coin Change",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "SOLVED",
    topics: "Dynamic Programming, BFS",
    url: "https://leetcode.com/problems/coin-change/",
    timeSpentMin: 33,
    solvedDaysAgo: 1,
    dueInDays: 1,
    ease: 2.3,
    repetitions: 2,
    intervalDays: 3,
    notes:
      "Bottom-up DP over amounts. dp[0] = 0 and every other value starts at infinity.",
    solution: `def coin_change(coins, amount):
    dp = [float("inf")] * (amount + 1)
    dp[0] = 0
    for value in range(1, amount + 1):
        for coin in coins:
            if coin <= value:
                dp[value] = min(dp[value], dp[value - coin] + 1)
    return -1 if dp[amount] == float("inf") else dp[amount]`,
  },
  {
    title: "Word Ladder",
    platform: "LeetCode",
    difficulty: "HARD",
    status: "TODO",
    topics: "BFS, Graph, String",
    url: "https://leetcode.com/problems/word-ladder/",
  },
  {
    title: "Trapping Rain Water",
    platform: "LeetCode",
    difficulty: "HARD",
    status: "TODO",
    topics: "Two Pointers, Stack, Dynamic Programming",
    url: "https://leetcode.com/problems/trapping-rain-water/",
  },
  {
    title: "Median of Two Sorted Arrays",
    platform: "LeetCode",
    difficulty: "HARD",
    status: "TODO",
    topics: "Binary Search, Array",
    url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
  },
  {
    title: "Clone Graph",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "TODO",
    topics: "Graph, DFS, BFS",
    url: "https://leetcode.com/problems/clone-graph/",
  },
  {
    title: "Implement Trie (Prefix Tree)",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "TODO",
    topics: "Trie, Design",
    url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
  },
  {
    title: "Min Stack",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "TODO",
    topics: "Stack, Design",
    url: "https://leetcode.com/problems/min-stack/",
  },
  {
    title: "Subsets",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "TODO",
    topics: "Backtracking, Bit Manipulation",
    url: "https://leetcode.com/problems/subsets/",
  },
  {
    title: "Daily Temperatures",
    platform: "LeetCode",
    difficulty: "MEDIUM",
    status: "TODO",
    topics: "Stack, Monotonic Stack",
    url: "https://leetcode.com/problems/daily-temperatures/",
  },
];

async function main() {
  // Container boot flag: only seed when the deck is completely empty, so a
  // redeploy never wipes real data.
  if (process.argv.includes("--if-empty")) {
    const existing = await prisma.problem.count();
    if (existing > 0) {
      console.log(
        `Deck already has ${existing} ${existing === 1 ? "problem" : "problems"} — skipping demo seed.`
      );
      return;
    }
  }

  console.log("Resetting AlgoDeck demo data…");
  await prisma.reviewLog.deleteMany();
  await prisma.problem.deleteMany();

  const created = [];

  for (const [index, problem] of problems.entries()) {
    const isSolved = problem.status === "SOLVED";

    const record = await prisma.problem.create({
      data: {
        title: problem.title,
        url: problem.url,
        platform: problem.platform,
        difficulty: problem.difficulty,
        status: problem.status,
        topics: problem.topics,
        notes: problem.notes ?? null,
        solution: problem.solution ?? null,
        timeSpentMin: problem.timeSpentMin ?? 0,
        solvedAt: isSolved ? addDays(today, -problem.solvedDaysAgo) : null,
        dueAt: isSolved ? addDays(today, problem.dueInDays) : null,
        lastReviewedAt: isSolved
          ? addDays(today, -Math.max(1, Math.min(3, problem.solvedDaysAgo)))
          : null,
        ease: problem.ease ?? 2.5,
        intervalDays: problem.intervalDays ?? 0,
        repetitions: problem.repetitions ?? 0,
        createdAt: addDays(
          today,
          -(isSolved
            ? problem.solvedDaysAgo + 2
            : ((problems.length - index) % 12) + 1)
        ),
      },
    });

    created.push(record);
  }

  const solvedProblems = created.filter(
    (problem) => problem.status === "SOLVED"
  );
  const ratings = [2, 2, 3, 1, 2, 3, 0, 2, 3];
  let reviewCount = 0;

  // ~6 months of history so the activity heatmap has real texture.
  // The most recent 14 days always have at least one review (keeps the streak).
  for (let dayOffset = 175; dayOffset >= 0; dayOffset -= 1) {
    const isCurrentStreak = dayOffset <= 13;
    if (!isCurrentStreak && (dayOffset * 3) % 11 === 0) continue;

    const day = addDays(today, -dayOffset);
    const perDay = isCurrentStreak
      ? ((dayOffset * 7) % 3) + 1
      : ((dayOffset * 5) % 2) + 1;

    for (let i = 0; i < perDay; i += 1) {
      const problem =
        solvedProblems[(dayOffset * 3 + i * 5) % solvedProblems.length];

      let reviewedAt = new Date(day.getTime() + (9 + i * 2) * 60 * 60 * 1000);
      if (reviewedAt.getTime() > Date.now()) {
        reviewedAt = new Date(Date.now() - (i + 1) * 60_000);
      }

      await prisma.reviewLog.create({
        data: {
          problemId: problem.id,
          rating: ratings[(dayOffset + i) % ratings.length],
          reviewedAt,
        },
      });

      reviewCount += 1;
    }
  }

  console.log(
    `Seeded ${created.length} problems and ${reviewCount} review logs.`
  );

  // Keep "last reviewed" consistent with the generated history.
  const latestLogs = await prisma.reviewLog.findMany({
    orderBy: { reviewedAt: "desc" },
  });
  const touched = new Set();

  for (const log of latestLogs) {
    if (touched.has(log.problemId)) continue;
    touched.add(log.problemId);
    await prisma.problem.update({
      where: { id: log.problemId },
      data: { lastReviewedAt: log.reviewedAt },
    });
  }

  console.log("Start the app with: npm run dev");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
