import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "./lib/auth";

const PUBLIC_API_PREFIXES = [
  "/api/push/subscribe",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Prevent auth-dependent API responses from being cached by proxies/CDNs
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isPublicApi) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
    }
    // All API responses vary by cookie (session-dependent content)
    response.headers.set("Vary", "Cookie");
    return response;
  }

  // Redirect unauthenticated users away from protected pages
  const session = request.cookies.get(COOKIE_NAME)?.value;
  const isProtected =
    pathname.startsWith("/medico") ||
    pathname.startsWith("/clinica") ||
    pathname.startsWith("/consultorio") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/recibo");

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from login/register pages
  if (session && (pathname.startsWith("/login") || pathname.startsWith("/registar"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/medico/:path*",
    "/clinica/:path*",
    "/consultorio/:path*",
    "/admin/:path*",
    "/support/:path*",
    "/recibo/:path*",
    "/login/:path*",
    "/registar/:path*",
  ],
};
