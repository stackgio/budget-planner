import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast gate: requests without a session cookie are sent to /login.
 * Real validation happens server-side (requireUser) on every page, action and API route.
 */
const PUBLIC = ["/login", "/setup", "/api/auth/passkey/login", "/api/health", "/manifest.webmanifest", "/icon.svg", "/apple-touch-icon.png"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (!req.cookies.get("lu_session")) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
