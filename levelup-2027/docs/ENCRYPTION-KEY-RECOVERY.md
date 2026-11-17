# Encryption key — backup & recovery

LEVEL UP encrypts private text (faith entries, relationship notes, date notes, goal notes, job notes, review and daily reflections, private notification details) with **AES-256-GCM** using `DATA_ENCRYPTION_KEY`.

**Without the key, that text cannot be recovered by anyone — including you.** Database backups alone are not enough.

## What the app already does

- The key is read only from the environment. It is never logged, never shown in the UI, never included in the JSON export, and `.env` is git-ignored.
- A stored *check value* lets the app tell whether the configured key is the one your notes were encrypted with. It reveals nothing about the key.
- If the key is missing or wrong, the app **fails safely**: private text shows “🔒 Private text unavailable” instead of crashing or showing garbage, and nothing is overwritten. Settings shows the key status.
- The app never generates, rotates or replaces your key automatically.

## Make a recovery copy (do this once, now)

1. Open `levelup-2027/.env` on your computer and copy the value of `DATA_ENCRYPTION_KEY` (44 characters ending in `=`).
2. Save it in a **password manager** (e.g. Apple Passwords / iCloud Keychain, 1Password, Bitwarden) as a secure note titled “LEVEL UP 2027 — DATA_ENCRYPTION_KEY”.
3. Optional second copy: write it on paper and keep it somewhere safe (not in your wallet).
4. **Never** paste it into GitHub, chat messages, email, notes apps that sync unencrypted, screenshots, or the LEVEL UP app itself.
5. Run `npm run key:check` — it should say `OK`.

When the app is deployed later, the same value goes into the hosting provider’s secret variables (never into the repository). Keep the password-manager copy as the source of truth.

## Restore

1. Put the saved value back into `.env` (or the host’s secret variables) as `DATA_ENCRYPTION_KEY="…"`.
2. Run `npm run key:check`.
   - `OK` — done.
   - `MISMATCH` — this is a different key. **Do not** create a new one: find the original. Notes encrypted with the old key stay unreadable until the right key is restored; they are not lost or changed.
   - `MISSING` / `INVALID` — the value is absent or mistyped (it must be 32 random bytes, base64).

## Proven by a drill

`npm run key:drill` runs the full backup → restore → verify cycle on **synthetic data, a synthetic key and temporary databases** (it never reads your real key and never touches `levelup_dev`):

1. create a temporary database and write synthetic encrypted notes,
2. dump the database and save the key separately (file mode 600),
3. restore into a second temporary database,
4. confirm the restored key reads the notes; a wrong key and a missing key both fail safely,
5. delete the temporary databases and files.

Last run: passed (see Phase 4 report).

## Not implemented on purpose

No “forgot key” reset, no key escrow on a server, no weaker fallback key, no automatic rotation. Each would either break the encryption or risk silently losing your notes. Key rotation can be added later as an explicit, tested, re-encrypt-everything operation if you ever want it.
