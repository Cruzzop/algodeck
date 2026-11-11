# AlgoDeck production image. Works on Northflank, Fly.io, a VPS or anywhere
# Docker runs.
#
# The SQLite database lives on a mounted volume. Prisma resolves relative
# SQLite paths against the prisma/ folder, so DATABASE_URL="file:./data/…"
# plus a volume mounted at /app/prisma/data keeps data across restarts and
# redeploys.
FROM node:22-bookworm-slim

WORKDIR /app

# Install everything, including devDependencies: the Prisma CLI used on boot
# lives there. NODE_ENV stays unset on purpose so npm ci installs them.
COPY package.json package-lock.json ./
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
