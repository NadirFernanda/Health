import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
