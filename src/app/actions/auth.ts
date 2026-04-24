"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const redirectTo = formData.get("redirect")?.toString() ?? "";

  if (!email || !password) {
    return { error: "Preencha o e-mail e a palavra-passe." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[loginAction] DB error:", e);
    return { error: "Erro de ligação à base de dados. Tente novamente." };
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Credenciais inválidas. Verifique e tente novamente." };
  }

  const dashboards: Record<string, string> = {
    ADMIN: "/admin",
    MEDICO: "/medico",
    CLINICA: "/clinica",
  };

  const token = await createSessionToken(user.id, email, user.role);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  const destination =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : dashboards[user.role] ?? "/";

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

