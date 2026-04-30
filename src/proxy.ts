import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getPayloadFromToken, COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/medico/:path*", "/clinica/:path*", "/consultorio/:path*"],
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  // Sem token ou assinatura HMAC inválida → login
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

  // Verificar se o role corresponde à rota acedida
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

