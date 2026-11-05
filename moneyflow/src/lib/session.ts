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

/** A usable explicit secret: long enough and not an unexpanded host template like "${{...}}". */
export function hasValidSessionSecret(): boolean {
  const s = process.env.MONEYFLOW_SESSION_SECRET ?? "";
  return s.length >= 32 && !s.includes("${{");
}

let keyPromise: Promise<CryptoKey> | null = null;

/**
 * HMAC signing key.
 * 1. MONEYFLOW_SESSION_SECRET when it is a real 32+ character value (preferred).
 * 2. Otherwise, with a passcode set, a key derived from the passcode using
 *    PBKDF2-SHA256 (210,000 iterations). The passcode already gates access, so
 *    this keeps the app working when a host fails to fill in the secret, while
 *    making offline guessing from a stolen cookie slow.
 * 3. Local development without a passcode: a fixed dev-only key (localhost only;
 *    the middleware refuses every other host).
 */
function signingKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const hmacAlg = { name: "HMAC", hash: "SHA-256" } as const;
    if (hasValidSessionSecret()) {
      return crypto.subtle.importKey("raw", enc.encode(process.env.MONEYFLOW_SESSION_SECRET!), hmacAlg, false, ["sign"]);
    }
    const passcode = process.env.MONEYFLOW_PASSCODE;
    if (passcode) {
      console.warn("MONEYFLOW_SESSION_SECRET is missing, too short, or an unexpanded template — deriving the session key from the passcode instead.");
      const base = await crypto.subtle.importKey("raw", enc.encode(passcode), "PBKDF2", false, ["deriveKey"]);
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: enc.encode("moneyflow-session-key-v1"), iterations: 210_000 },
        base,
        { ...hmacAlg, length: 256 },
        false,
        ["sign"],
      );
    }
    return crypto.subtle.importKey("raw", enc.encode("moneyflow-local-development-only-secret"), hmacAlg, false, ["sign"]);
  })();
  return keyPromise;
}

function b64url(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  return b64url(await crypto.subtle.sign("HMAC", await signingKey(), enc.encode(data)));
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
