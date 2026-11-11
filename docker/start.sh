#!/bin/sh
# AlgoDeck container entrypoint:
#   1. sync the Prisma schema to the mounted SQLite volume
#   2. optionally seed demo data once (never overwrites existing data)
#   3. start Next.js
set -e

echo "[algodeck] syncing database schema…"
npx prisma db push --skip-generate

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  echo "[algodeck] seeding demo data (skipped automatically if data exists)…"
  node prisma/seed.mjs --if-empty
fi

echo "[algodeck] starting Next.js on port ${PORT:-3000}…"
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
