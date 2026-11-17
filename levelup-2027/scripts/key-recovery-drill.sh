#!/usr/bin/env bash
# Encryption-key recovery drill on SYNTHETIC data and TEMPORARY databases.
# It never reads or prints your real DATA_ENCRYPTION_KEY and never touches levelup_dev.
# Requires a local Postgres where the "levelup" role may create databases.
set -euo pipefail
cd "$(dirname "$0")/.."
PGHOST=${PGHOST:-localhost}; PGUSER=${PGUSER:-levelup}; export PGPASSWORD=${PGPASSWORD:-levelup_local_dev}
SRC=levelup_keydrill_src; DST=levelup_keydrill_restore
WORK=$(mktemp -d); trap 'rm -rf "$WORK"; dropdb -h $PGHOST -U $PGUSER --if-exists $SRC; dropdb -h $PGHOST -U $PGUSER --if-exists $DST' EXIT
url() { echo "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:5432/$1"; }
run() { DATABASE_URL=$(url "$1") DATA_ENCRYPTION_KEY="$2" npx tsx --conditions=react-server scripts/key-drill-check.ts "${@:3}"; }

echo "1. Create a temporary database and a SYNTHETIC key (not yours)"
dropdb -h $PGHOST -U $PGUSER --if-exists $SRC; dropdb -h $PGHOST -U $PGUSER --if-exists $DST
createdb -h $PGHOST -U $PGUSER $SRC
DATABASE_URL=$(url $SRC) npx prisma migrate deploy >/dev/null
DRILL_KEY=$(openssl rand -base64 32)

echo "2. Write synthetic encrypted notes"
run $SRC "$DRILL_KEY" seed

echo "3. Back up: database dump + key copy saved separately (file mode 600)"
pg_dump -h $PGHOST -U $PGUSER -Fc $SRC > "$WORK/backup.dump"
umask 077; printf '%s\n' "$DRILL_KEY" > "$WORK/levelup-key.txt"; chmod 600 "$WORK/levelup-key.txt"
unset DRILL_KEY

echo "4. Restore the dump into a fresh database"
createdb -h $PGHOST -U $PGUSER $DST
pg_restore -h $PGHOST -U $PGUSER -d $DST --no-owner "$WORK/backup.dump"

echo "5. Restored key from the backup copy → notes readable"
run $DST "$(cat "$WORK/levelup-key.txt")" verify OK

echo "6. Wrong key → safe failure (no crash, no garbage)"
run $DST "$(openssl rand -base64 32)" verify MISMATCH

echo "7. Missing key → safe failure"
run $DST "" verify MISSING

echo "Drill passed. Temporary databases and files are removed on exit."
