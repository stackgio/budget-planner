import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC = (p: string) =>
  p === "/login" || p === "/api/health" || p.startsWith("/_next") || p === "/favicon.ico" || p === "/manifest.webmanifest" || p.startsWith("/icon") || p.startsWith("/apple-icon");

function isLocalRequest(req: NextRequest): boolean {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!authEnabled()) {
    // Fail closed: without a passcode, MoneyFlow only serves your own computer.
    if (isLocalRequest(req) || pathname === "/api/health") return NextResponse.next();
    return new NextResponse(
      "<!doctype html><meta name=viewport content='width=device-width'><body style='font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem'><h1>MoneyFlow is locked</h1><p>No passcode is configured, so MoneyFlow refuses to show financial data to anything except localhost.</p><p>Set <code>MONEYFLOW_PASSCODE</code> and <code>MONEYFLOW_SESSION_SECRET</code> and restart.</p>",
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  if (PUBLIC(pathname)) return NextResponse.next();
  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
