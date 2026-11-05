# MoneyFlow production image (used by Railway; works on any Docker host)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npx next build

ENV NODE_ENV=production
# SQLite lives on a persistent volume mounted at /data (see README > Deploy to Railway)
ENV DATABASE_URL="file:/data/moneyflow.db"
EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
