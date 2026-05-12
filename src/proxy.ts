import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getPayloadFromToken, COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/medico/:path*",
    "/clinica/:path*",
    "/consultorio/:path*",
    "/support/:path*",
    "/recibo/:path*",
    "/login/:path*",
    "/registar/:path*",
  ],
};

const ROLE_PREFIXES: Record<string, string> = {
  "/admin":       "ADMIN",
  "/medico":      "MEDICO",
  "/clinica":     "CLINICA",
  "/consultorio": "PROPRIETARIO_SALA",
};

const DASHBOARDS: Record<string, string> = {
  ADMIN:             "/admin",
  MEDICO:            "/medico",
  CLINICA:           "/clinica",
  PROPRIETARIO_SALA: "/consultorio",
  PROFISSIONAL:      "/medico",
};

const PUBLIC_API_PREFIXES = ["/api/push/subscribe"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // API routes: prevent caching of session-dependent responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isPublicApi) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
    }
    response.headers.set("Vary", "Cookie");
    return response;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Redirect authenticated users away from login/register pages
  if (pathname.startsWith("/login") || pathname.startsWith("/registar")) {
    if (token && (await verifySessionToken(token))) {
      const payload = getPayloadFromToken(token);
      if (payload) {
        return NextResponse.redirect(
          new URL(DASHBOARDS[payload.role] ?? "/", request.url)
        );
      }
    }
    return NextResponse.next();
  }

  // Protected pages: require a valid session
  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = getPayloadFromToken(token);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify role matches the route being accessed
  const requiredRole = Object.entries(ROLE_PREFIXES).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  )?.[1];

  if (requiredRole && payload.role !== requiredRole) {
    return NextResponse.redirect(
      new URL(DASHBOARDS[payload.role] ?? "/login", request.url)
    );
  }

  return NextResponse.next();
}
