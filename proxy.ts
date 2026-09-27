import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PAGES = ["/agent"];
const AUTH_PAGES = ["/agent/login"];
const PROTECTED_API_PREFIXES = ["/api/agent", "/api/conversations"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_PAGES.some((p) => p === "/agent" && (pathname === p || pathname.startsWith(`${p}/`)) && !AUTH_PAGES.some((a) => pathname.startsWith(a)));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isAuthPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const agentToken = request.cookies.get("ekshop_agent_token")?.value;

  // API routes: never redirect, pass through; route handlers return their own 401.
  if (isProtectedApi) {
    return NextResponse.next();
  }

  if (isProtectedPage && !agentToken) {
    const loginUrl = new URL("/agent/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && agentToken) {
    return NextResponse.redirect(new URL("/agent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/agent/:path*",
    "/api/agent/:path*",
    "/api/conversations/:path*",
  ],
};