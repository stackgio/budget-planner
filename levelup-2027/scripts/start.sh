#!/usr/bin/env bash
# Production entrypoint: apply migrations (additive, non-destructive), then run the web app and the
# reminder/backup worker side by side. If either stops, the container exits and Railway restarts it.
set -euo pipefail
DATABASE_URL="$(node scripts/database-url.mjs)"
export DATABASE_URL
npx prisma migrate deploy
node_modules/.bin/tsx --conditions=react-server scripts/worker.ts &
WORKER=$!
node_modules/.bin/next start -p "${PORT:-3000}" &
WEB=$!
trap 'kill -TERM $WORKER $WEB 2>/dev/null' TERM INT
STATUS=0
wait -n $WORKER $WEB || STATUS=$?
kill -TERM $WORKER $WEB 2>/dev/null || true
wait || true
exit $(( STATUS == 0 ? 1 : STATUS ))  # either process stopping is a failure → Railway restarts the container
