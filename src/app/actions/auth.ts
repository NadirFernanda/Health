"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export type LoginState = { error: string } | null;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "planto@admin2025";

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const redirectTo = formData.get("redirect")?.toString() ?? "/admin";

  if (!username || !password) {
    return { error: "Preencha o utilizador e a palavra-passe." };
  }

  // Comparação em tempo constante não é crítica aqui pois é admin interno,
  // mas evitamos short-circuit com checks simples.
  const userMatch = username === ADMIN_USERNAME;
  const passMatch = password === ADMIN_PASSWORD;

  if (!userMatch || !passMatch) {
    return { error: "Credenciais inválidas. Tente novamente." };
  }

  const token = await createSessionToken(username);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Garantir que o redirect é interno (evitar open redirect)
  const safe = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
  redirect(safe);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
