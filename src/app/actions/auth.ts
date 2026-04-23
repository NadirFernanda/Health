"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE, UserRole } from "@/lib/auth";

export type LoginState = { error: string } | null;

// ---------------------------------------------------------------------------
// Credenciais do protótipo (mock) — substituir por BD em produção
// ---------------------------------------------------------------------------
type MockUser = { email: string; password: string; role: UserRole; dashboard: string };

const MOCK_USERS: MockUser[] = [
  {
    email: (process.env.ADMIN_EMAIL ?? "admin@plantoamed.ao"),
    password: (process.env.ADMIN_PASSWORD ?? "planto@admin2025"),
    role: "ADMIN",
    dashboard: "/admin",
  },
  {
    email: (process.env.MEDICO_EMAIL ?? "medico@plantoamed.ao"),
    password: (process.env.MEDICO_PASSWORD ?? "med123456"),
    role: "MEDICO",
    dashboard: "/medico",
  },
  {
    email: (process.env.CLINICA_EMAIL ?? "clinica@horizonte.ao"),
    password: (process.env.CLINICA_PASSWORD ?? "cli123456"),
    role: "CLINICA",
    dashboard: "/clinica",
  },
];

// ---------------------------------------------------------------------------

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

  const user = MOCK_USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    return { error: "Credenciais inválidas. Verifique e tente novamente." };
  }

  const token = await createSessionToken(email, user.role);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Validar redirect: só aceitar caminhos do próprio role ou usar o dashboard padrão
  const allowedPrefixes: Record<UserRole, string> = {
    ADMIN: "/admin",
    MEDICO: "/medico",
    CLINICA: "/clinica",
  };
  const allowed = allowedPrefixes[user.role];
  const safe = redirectTo.startsWith(allowed) ? redirectTo : user.dashboard;

  redirect(safe);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
