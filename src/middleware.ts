import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getPayloadFromToken, COOKIE_NAME } from "@/lib/auth";

const PROTECTED: Record<string, string[]> = {
  "/admin":       ["ADMIN"],
  "/medico":      ["MEDICO"],
  "/clinica":     ["CLINICA"],
  "/consultorio": ["PROPRIETARIO_SALA"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determinar qual role é necessária para esta rota
  const requiredRoles = Object.entries(PROTECTED).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  )?.[1];

  if (!requiredRoles) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = getPayloadFromToken(token);
  if (!payload || !requiredRoles.includes(payload.role)) {
    // Autenticado mas sem permissão — redirecionar para o dashboard correto
    const dashboards: Record<string, string> = {
      ADMIN:              "/admin",
      MEDICO:             "/medico",
      CLINICA:            "/clinica",
      PROPRIETARIO_SALA:  "/consultorio",
      PROFISSIONAL:       "/medico",
    };
    return NextResponse.redirect(
      new URL(dashboards[payload?.role ?? ""] ?? "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/medico/:path*",
    "/clinica/:path*",
    "/consultorio/:path*",
  ],
};
