import { NextRequest, NextResponse } from "next/server";
import { decodeToken, COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/medico/:path*", "/clinica/:path*", "/consultorio/:path*"],
};

const ROLE_PREFIXES: Record<string, string> = {
  "/admin": "ADMIN",
  "/medico": "MEDICO",
  "/clinica": "CLINICA",
  "/consultorio": "PROPRIETARIO_SALA",
};

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  const payload = token ? decodeToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o role corresponde à rota acedida
  const requiredRole = Object.entries(ROLE_PREFIXES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (requiredRole && payload.role !== requiredRole) {
    const dashboards: Record<string, string> = {
      ADMIN: "/admin",
      MEDICO: "/medico",
      CLINICA: "/clinica",
      PROPRIETARIO_SALA: "/consultorio",
    };
    return NextResponse.redirect(
      new URL(dashboards[payload.role] ?? "/login", request.url)
    );
  }

  return NextResponse.next();
}
