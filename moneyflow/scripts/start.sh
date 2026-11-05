#!/bin/sh
# Production entrypoint: refuse to start unsecured, sync the schema, then serve.
set -e
if [ -z "$MONEYFLOW_PASSCODE" ]; then
  echo "WARNING: MONEYFLOW_PASSCODE is not set. MoneyFlow will refuse every non-localhost request until it is."
elif [ ${#MONEYFLOW_SESSION_SECRET} -lt 32 ]; then
  echo "NOTE: MONEYFLOW_SESSION_SECRET is missing or short; the session key will be derived from the passcode."
fi
case "$DATABASE_URL" in
  file:/data/*) mkdir -p /data ;;
esac
npx prisma db push --skip-generate
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
