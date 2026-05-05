import { NextRequest } from "next/server";
import { requireMaster } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const auth = await requireMaster();
  if (auth instanceof Response) return auth;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        adminRole: true,
        adminEmail: true,
        adminCargo: true,
        adminPhone: true,
        criadoEm: true,
        isActive: true,
      },
      orderBy: [{ adminRole: "asc" }, { criadoEm: "asc" }],
    });

    return Response.json(admins);
  } catch (err) {
    console.error("[GET /api/admin/admins]", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

const createSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  adminRole: z.enum(["FINANCEIRO", "GESTOR", "SUPORTE", "ANALISTA"]),
  adminEmail: z.email().optional(),
  adminCargo: z.string().max(100).optional(),
  adminPhone: z.string().max(30).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireMaster();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 422 });

  const { email, password, adminRole, adminEmail, adminCargo, adminPhone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "Email já em uso" }, { status: 409 });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        adminRole: adminRole as never,
        adminEmail: adminEmail ?? email,
        adminCargo,
        adminPhone,
      },
      select: {
        id: true,
        email: true,
        adminRole: true,
        adminCargo: true,
        criadoEm: true,
      },
    });
    return Response.json(admin, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/admins]", err);
    return Response.json({ error: "Erro ao criar admin" }, { status: 500 });
  }
}
