# Backup & Restore

LEVEL UP keeps your financial history and encrypted notes in PostgreSQL. This page explains how to back it up, prove a backup works, and recover.

## Two things to keep safe, separately

| What | Where it lives | If you lose it |
|---|---|---|
| **Backup files** (`levelup-YYYYMMDDTHHMMSSZ.lubk`) | `BACKUP_DIR` (default `./backups`, never committed to Git) plus a copy off the machine | You can only restore to the last backup you still have |
| **Backup passphrase** (`BACKUP_PASSPHRASE`) | Your password manager | Backup files can't be opened |
| **`DATA_ENCRYPTION_KEY`** | Your password manager, in a **separate entry** from the passphrase | Money, goals and tasks restore fine; private notes stay locked |

Backups deliberately do **not** contain `DATA_ENCRYPTION_KEY`. A stolen backup reveals nothing without the passphrase, and private notes inside it stay encrypted even then.

## Commands (local, free)

```bash
export BACKUP_PASSPHRASE='…16+ characters, from your password manager…'   # or BACKUP_PASSPHRASE_FILE=/path/600-file
npm run backup:create                                  # dump → encrypt → verify → retention (14 daily, 8 weekly)
npm run backup:verify -- backups/levelup-….lubk        # decrypt + checksum + table of contents
npm run backup:restore-test -- backups/levelup-….lubk  # restore into a NEW temporary DB, integrity check, drop it
npm run backup:drill                                   # full drill on synthetic data (no real data or key involved)
```

Retention is set with `BACKUP_KEEP_DAILY` (default 14) and `BACKUP_KEEP_WEEKLY` (default 8). The newest backup is never deleted. Only files named `levelup-*.lubk` are touched.

## How it works

- `pg_dump -Fc` → AES-256-GCM encryption. The key is derived from your passphrase with scrypt, using a random salt per file. The header is authenticated, so any change to the file is detected.
- The file is written with mode 600 and an atomic rename, and is verified straight away.
- The database password goes to `pg_dump` through `PGPASSWORD`, never on the command line. Passphrases, keys and connection passwords are never printed.
- **Restores never overwrite a database.** They only create a new database whose name starts with `levelup_restore_` or `levelup_drill_`, and they refuse anything else, including `levelup_dev`.

## Recovering for real

1. Get the newest `.lubk` file, the backup passphrase and `DATA_ENCRYPTION_KEY` from your password manager.
2. Run `npm run backup:verify -- <file>`.
3. Run `npm run backup:restore-test -- <file>` and confirm that ledger issues are "none" and notes are readable.
4. Restore into a new database:
   - call `restoreToNewDatabase` (`dbName: levelup_restore_<date>`), or
   - run `pg_restore` yourself into a database you create.
5. Point `DATABASE_URL` at the restored database and set `DATA_ENCRYPTION_KEY` to your saved key.
6. Run `npm run key:check`. It should report **OK**.
7. Open Money → Overview. It should show **Ledger reconciled**.
8. Only after that, retire the old database. You do this by hand, and nothing in LEVEL UP does it for you.

## Drill result (Phase 5, synthetic data)

`npm run backup:drill` passed in about 8 seconds:

- Created a temporary database, migrated it, and seeded synthetic data covering the ledger, Roulette, challenges, auth, goals, tasks, encrypted notes, notification settings and gig income.
- Backed it up encrypted: 147 KB, 65 tables.
- Verify succeeded. A wrong passphrase was rejected, a tampered file was rejected, and a restore into `levelup_dev` was refused.
- Restored into a new temporary database. The snapshot of 414 rows was **identical**:
  - ledger reconciled with no issues;
  - challenge progress, auth fingerprint, notification settings, gig totals and analytics totals all matched;
  - 3 of 3 notes were readable.
- With a wrong `DATA_ENCRYPTION_KEY` the key check reported MISMATCH. All notes showed the locked notice and the money data was unaffected.
- With a missing key the key check reported MISSING, with the same safe failure.
- Both temporary databases were dropped.

## Schedule (after deployment, proposal)

- **Daily** backup at about 03:30 ET.
- **Restore test** monthly with `backup:restore-test`, plus after every migration.
- **Off-machine copy:** weekly, kept in a different place from the server.
