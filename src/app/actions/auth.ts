"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit as redisCheckRateLimit, resetRateLimit } from "@/lib/rate-limiter";

export type LoginState = { error: string } | null;

const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 15 * 60; // 15 minutos

async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const result = await redisCheckRateLimit({
    key: `login:${ip}`,
    maxRequests: MAX_ATTEMPTS,
    windowSeconds: WINDOW_SECONDS,
  });
  return result.allowed;
}

async function clearLoginRateLimit(ip: string): Promise<void> {
  await resetRateLimit(`login:${ip}`);
}

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

  // Rate limit por IP (Redis — persistente entre processos e restarts)
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  const allowed = await checkLoginRateLimit(ip);
  if (!allowed) {
    return { error: "Demasiadas tentativas. Aguarde 15 minutos e tente novamente." };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[loginAction] DB error:", e);
    return { error: "Erro de ligação à base de dados. Tente novamente." };
  }

  if (!user) {
    return { error: "Não existe nenhuma conta com este e-mail. Verifique ou crie uma conta." };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "Palavra-passe incorrecta. Tente novamente ou recupere a sua password." };
  }

  // Login bem-sucedido — limpar rate limit
  await clearLoginRateLimit(ip);

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

