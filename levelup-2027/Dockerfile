# LEVEL UP 2027 production image (Railway builds this; works on any Docker host). Not deployed yet.
FROM node:22-bookworm-slim
# PostgreSQL client tools for encrypted backups (pg_dump/pg_restore). Must be >= the database's major version.
ARG PG_MAJOR=17
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg openssl bash \
 && install -d /usr/share/postgresql-common/pgdg \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
 && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update && apt-get install -y --no-install-recommends "postgresql-client-${PG_MAJOR}" \
 && apt-get purge -y --auto-remove curl gnupg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx next build && chown -R node:node /app
ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["bash", "scripts/start.sh"]
