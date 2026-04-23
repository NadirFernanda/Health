import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getRoleFromToken, COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/medico/:path*", "/clinica/:path*"],
};

const ROLE_PREFIXES: Record<string, string> = {
  "/admin": "ADMIN",
  "/medico": "MEDICO",
  "/clinica": "CLINICA",
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o role do token corresponde à rota acedida
  const role = getRoleFromToken(token);
  const requiredRole = Object.entries(ROLE_PREFIXES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (requiredRole && role !== requiredRole) {
    // Redirecionar para o dashboard do role correto
    const dashboards: Record<string, string> = {
      ADMIN: "/admin",
      MEDICO: "/medico",
      CLINICA: "/clinica",
    };
    return NextResponse.redirect(new URL(dashboards[role ?? ""] ?? "/login", request.url));
  }

  return NextResponse.next();
}
