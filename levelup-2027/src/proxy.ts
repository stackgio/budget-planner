import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. Content-Security-Policy with a fresh nonce on every request. Next.js reads the nonce from the
 *    request's CSP header and puts it on its own scripts; any other script (an injected <script>, an
 *    inline handler, a third-party URL) is refused by the browser.
 * 2. Fast gate: requests without a session cookie are sent to /login.
 *    Real validation happens server-side (requireUser) on every page, action and API route.
 */
const PUBLIC = ["/login", "/setup", "/api/auth/passkey/login", "/api/health", "/api/cron/tick", "/api/setup/restore", "/api/setup/check", "/sw.js", "/manifest.webmanifest", "/icon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/splash"];
const COOKIES = ["lu_session", "__Host-lu_session"];

export function buildCsp(nonce: string, opts: { dev: boolean; https: boolean }) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${opts.dev ? " 'unsafe-eval'" : ""}`,
    // React style={{…}} attributes need inline styles; no inline <script> is ever allowed.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${opts.dev ? " ws: wss:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(opts.https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isPublic && !COOKIES.some((c) => req.cookies.get(c))) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, { dev: process.env.NODE_ENV !== "production", https: (process.env.APP_ORIGIN ?? "").startsWith("https://") });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
