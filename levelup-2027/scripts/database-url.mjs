// Prints the database URL the app should use. If LEVELUP_DATABASE_NAME is set (after a disaster restore
// into levelup_restore_…), it replaces the database name in DATABASE_URL — one variable to change on iPhone.
const raw = process.env.DATABASE_URL;
if (!raw) { console.error("DATABASE_URL is not set"); process.exit(1); }
const name = process.env.LEVELUP_DATABASE_NAME;
if (!name) { process.stdout.write(raw); process.exit(0); }
if (!/^[a-z0-9_]{1,63}$/.test(name)) { console.error("LEVELUP_DATABASE_NAME must be lowercase letters, digits and _"); process.exit(1); }
const u = new URL(raw);
u.pathname = `/${name}`;
process.stdout.write(u.toString());
