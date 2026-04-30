"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type LoginState = { error: string } | null;

// Rate limiting simples em memória — máx. 10 tentativas por IP em 15 min
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
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

  // Rate limit por IP
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
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
  clearRateLimit(ip);

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

