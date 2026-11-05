/**
 * Signed cookies using Web Crypto HMAC-SHA256 (works in middleware and Node).
 * Used for (1) the optional passcode login session and (2) the active workspace.
 */
const enc = new TextEncoder();

export const SESSION_COOKIE = "mf_session";
export const WORKSPACE_COOKIE = "mf_ws";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export function authEnabled(): boolean {
  return !!process.env.MONEYFLOW_PASSCODE;
}

function secret(): string {
  const s = process.env.MONEYFLOW_SESSION_SECRET;
  if (authEnabled() && (!s || s.length < 32)) {
    throw new Error("MONEYFLOW_SESSION_SECRET must be set (32+ chars) when MONEYFLOW_PASSCODE is enabled.");
  }
  // Local-only fallback: cookies are still integrity-checked, but this is NOT a
  // secure configuration for hosting. See README > Security.
  return s ?? "moneyflow-local-development-only-secret";
}

function b64url(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function sign(value: string): Promise<string> {
  return `${value}.${await hmac(value)}`;
}

export async function unsign(signed: string | undefined | null): Promise<string | null> {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  return safeEqual(signed.slice(i + 1), await hmac(value)) ? value : null;
}

export async function makeSessionToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return sign(`v1:${exp}`);
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const v = await unsign(token);
  if (!v) return false;
  const [ver, exp] = v.split(":");
  return ver === "v1" && Number(exp) > Date.now() / 1000;
}

export async function checkPasscode(input: string): Promise<boolean> {
  const expected = process.env.MONEYFLOW_PASSCODE ?? "";
  // Compare HMACs so timing doesn't leak the passcode length/content.
  return safeEqual(await hmac(`pc:${input}`), await hmac(`pc:${expected}`));
}
