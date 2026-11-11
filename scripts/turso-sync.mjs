// Applies the Prisma schema to a remote Turso (libSQL) database.
// Local development keeps using prisma db push against SQLite.
//
// Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env (see .env.example).
//
// Usage:
//   node scripts/turso-sync.mjs           sync the schema (idempotent)
//   node scripts/turso-sync.mjs --seed    sync the schema, then load demo data
import { execFileSync, spawnSync } from "node:child_process";

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
if (!tursoUrl || !process.env.TURSO_AUTH_TOKEN?.trim()) {
  console.error(
    "Missing Turso credentials. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to .env (copy them from the Turso dashboard)."
  );
  process.exit(1);
}

const { createClient } = await import("@libsql/client");

console.log("Generating schema SQL (prisma migrate diff)…");
const sql = execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script",
  ],
  {
    encoding: "utf8",
    // Prisma only needs a syntactically valid SQLite URL to load the schema.
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db" },
  }
);

const db = createClient({
  url: tursoUrl,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

console.log("Applying schema to the Turso database…");
await db.executeMultiple(sql);
console.log("Schema applied.");

if (process.argv.includes("--seed")) {
  console.log("Loading demo data…");
  const result = spawnSync("node", ["prisma/seed.mjs"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("Seeding failed.");
    process.exit(1);
  }
}

console.log("Done. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN on your host and deploy.");
