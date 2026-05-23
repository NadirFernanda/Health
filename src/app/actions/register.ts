"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validarDocumentoIdentificacao } from "@/lib/validacao-angola";

const TIPOS_PROFISSIONAL = ["MEDICO", "ENFERMEIRO", "TECNICO_SAUDE"] as const;

const profissionalSchema = z.object({
  nome: z.string().min(3, "Nome demasiado curto").max(120, "Nome demasiado longo"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres").max(128),
  tipo: z.enum(TIPOS_PROFISSIONAL).default("MEDICO"),
  especialidade: z.string().min(2, "Especialidade obrigatória").max(100),
  zonaLuanda: z.string().max(100).optional(),
  numeroSinome: z.string().max(50).optional(),
  numeroBi: z.string().max(20).optional(),
});

const clinicaSchema = z.object({
  nome: z.string().min(3, "Nome demasiado curto").max(120, "Nome demasiado longo"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres").max(128),
  zonaLuanda: z.string().min(1, "Zona obrigatória").max(100),
  morada: z.string().max(200).optional(),
  contacto: z.string().max(50).optional(),
});

const consultorioSchema = z.object({
  nome: z.string().min(3, "Nome demasiado curto").max(120, "Nome demasiado longo"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Palavra-passe deve ter pelo menos 8 caracteres").max(128),
  zonaLuanda: z.string().min(1, "Zona obrigatória").max(100),
  morada: z.string().max(200).optional(),
  contacto: z.string().max(50).optional(),
});

export type RegisterState = { error: string } | null;

export async function registerProfissionalAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    nome: formData.get("nome")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
    password: formData.get("password")?.toString() ?? "",
    tipo: formData.get("tipo")?.toString() ?? "MEDICO",
    especialidade: formData.get("especialidade")?.toString().trim() ?? "",
    zonaLuanda: formData.get("zonaLuanda")?.toString().trim() || undefined,
    numeroSinome: formData.get("numeroSinome")?.toString().trim() || undefined,
    numeroBi: formData.get("numeroBi")?.toString().trim() || undefined,
  };

  const parsed = profissionalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, password, tipo, especialidade, zonaLuanda, numeroSinome, numeroBi } = parsed.data;

  if (numeroBi) {
    const biCheck = validarDocumentoIdentificacao(numeroBi);
    if (!biCheck.valido) return { error: biCheck.erro ?? "BI/Passaporte inválido." };
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
          tipo,
          especialidade,
          cidade: zonaLuanda ?? null,
          numeroSinome: numeroSinome ?? null,
          numeroBi: numeroBi ?? null,
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

  redirect("/medico/boas-vindas");
}

export async function registerClinicaAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    nome: formData.get("nome")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
    password: formData.get("password")?.toString() ?? "",
    zonaLuanda: formData.get("zonaLuanda")?.toString().trim() ?? "",
    morada: formData.get("morada")?.toString().trim() || undefined,
    contacto: formData.get("contacto")?.toString().trim() || undefined,
  };

  const parsed = clinicaSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, password, zonaLuanda, morada, contacto } = parsed.data;

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
          zonaLuanda: zonaLuanda ?? null,
          morada: morada ?? null,
          contacto: contacto ?? null,
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

  redirect("/clinica/boas-vindas");
}

export async function registerConsultorioAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    nome: formData.get("nome")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
    password: formData.get("password")?.toString() ?? "",
    zonaLuanda: formData.get("zonaLuanda")?.toString().trim() ?? "",
    morada: formData.get("morada")?.toString().trim() || undefined,
    contacto: formData.get("contacto")?.toString().trim() || undefined,
  };

  const parsed = consultorioSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, password, zonaLuanda, morada, contacto } = parsed.data;

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
          zonaLuanda: zonaLuanda ?? null,
          morada: morada ?? null,
          contacto: contacto ?? null,
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

  redirect("/consultorio/boas-vindas");
}
