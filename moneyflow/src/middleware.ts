import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname === "/manifest.webmanifest" || pathname.startsWith("/icon")) {
    return NextResponse.next();
  }
  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
