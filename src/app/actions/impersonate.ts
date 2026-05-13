"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, COOKIE_MAX_AGE, verifySessionToken, getPayloadFromToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_TOKEN_COOKIE = "medfreela_admin_token";

export async function exitImpersonationAction(): Promise<void> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!adminToken || !(await verifySessionToken(adminToken))) {
    cookieStore.delete(ADMIN_TOKEN_COOKIE);
    redirect("/login");
  }

  const adminPayload = getPayloadFromToken(adminToken!);
  const currentPayload = getPayloadFromToken(cookieStore.get(COOKIE_NAME)?.value ?? "");

  // Audit trail
  if (adminPayload && currentPayload) {
    await prisma.auditLog.create({
      data: {
        entity: "User",
        entityId: currentPayload.id,
        action: "ADMIN_IMPERSONATE_END",
        detalhes: { adminId: adminPayload.id, adminEmail: adminPayload.sub },
        usuarioId: adminPayload.id,
      },
    });
  }

  const isSecure = process.env.NODE_ENV === "production";
  cookieStore.set(COOKIE_NAME, adminToken!, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  cookieStore.delete(ADMIN_TOKEN_COOKIE);

  redirect("/admin");
}
