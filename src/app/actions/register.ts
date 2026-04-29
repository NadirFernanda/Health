"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type RegisterState = { error: string } | null;

export async function registerProfissionalAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const nome = formData.get("nome")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const tipo = formData.get("tipo")?.toString() ?? "MEDICO";
  const especialidade = formData.get("especialidade")?.toString().trim() ?? "";
  const numeroSinome = formData.get("numeroSinome")?.toString().trim() ?? "";

  if (!nome || !email || !password || !especialidade) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password.length < 8) {
    return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail já está registado. Tente iniciar sessão." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "MEDICO",
      profissional: {
        create: {
          nome,
          tipo: tipo as "MEDICO" | "ENFERMEIRO" | "TECNICO_SAUDE",
          especialidade,
          numeroSinome: numeroSinome || null,
        },
      },
    },
  });

  const token = await createSessionToken(user.id, email, user.role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/medico");
}

export async function registerClinicaAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const nome = formData.get("nome")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const zonaLuanda = formData.get("zonaLuanda")?.toString().trim() ?? "";
  const morada = formData.get("morada")?.toString().trim() ?? "";
  const contacto = formData.get("contacto")?.toString().trim() ?? "";

  if (!nome || !email || !password || !zonaLuanda) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password.length < 8) {
    return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail já está registado. Tente iniciar sessão." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "CLINICA",
      clinica: {
        create: {
          nome,
          zonaLuanda: zonaLuanda || null,
          morada: morada || null,
          contacto: contacto || null,
        },
      },
    },
  });

  const token = await createSessionToken(user.id, email, user.role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/clinica");
}

export async function registerConsultorioAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const nome = formData.get("nome")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const zonaLuanda = formData.get("zonaLuanda")?.toString().trim() ?? "";
  const morada = formData.get("morada")?.toString().trim() ?? "";
  const contacto = formData.get("contacto")?.toString().trim() ?? "";

  if (!nome || !email || !password || !zonaLuanda) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password.length < 8) {
    return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Este e-mail já está registado. Tente iniciar sessão." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "PROPRIETARIO_SALA",
      consultorio: {
        create: {
          nome,
          zonaLuanda: zonaLuanda || null,
          morada: morada || null,
          contacto: contacto || null,
        },
      },
    },
  });

  const token = await createSessionToken(user.id, email, user.role);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/consultorio");
}
