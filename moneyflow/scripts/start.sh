#!/bin/sh
# Production entrypoint: refuse to start unsecured, sync the schema, then serve.
set -e
if [ -z "$MONEYFLOW_PASSCODE" ] || [ ${#MONEYFLOW_SESSION_SECRET} -lt 32 ]; then
  echo "WARNING: MONEYFLOW_PASSCODE and MONEYFLOW_SESSION_SECRET (32+ chars) are not both set."
  echo "MoneyFlow will refuse every non-localhost request until they are."
fi
case "$DATABASE_URL" in
  file:/data/*) mkdir -p /data ;;
esac
npx prisma db push --skip-generate
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
