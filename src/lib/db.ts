import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Local development talks to a SQLite file through DATABASE_URL. Hosted
 * deployments point at a free Turso (libSQL) database by setting
 * TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, which swaps in a driver adapter —
 * the same queries work in both modes.
 */
function makePrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
