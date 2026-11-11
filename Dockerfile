# AlgoDeck production image. Works on Northflank, Fly.io, a VPS or anywhere
# Docker runs.
#
# The SQLite database lives on a mounted volume. Prisma resolves relative
# SQLite paths against the prisma/ folder, so DATABASE_URL="file:./data/…"
# plus a volume mounted at /app/prisma/data keeps data across restarts and
# redeploys.
FROM node:22-bookworm-slim

WORKDIR /app

# Prisma's engine detection needs the openssl binary, which slim images omit.
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies. The postinstall hook runs `prisma generate`, so the
# schema must already be present.
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

COPY . .

# Build with a throwaway SQLite path; the real database is mounted at runtime.
RUN mkdir -p prisma/data \
  && DATABASE_URL="file:./data/algodeck.db" npm run build

COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

ENV NODE_ENV=production \
    DATABASE_URL="file:./data/algodeck.db" \
    PORT=3000

EXPOSE 3000

CMD ["start.sh"]
