import { NextRequest } from "next/server";
import { requireMaster } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  adminRole: z.enum(["FINANCEIRO", "GESTOR", "SUPORTE", "ANALISTA"]).nullable().optional(),
  adminCargo: z.string().max(100).optional(),
  adminPhone: z.string().max(30).optional(),
  adminEmail: z.email().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMaster();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id, role: "ADMIN" },
    select: { id: true, adminRole: true },
  });
  if (!target) return Response.json({ error: "Admin não encontrado" }, { status: 404 });

  // Prevent master from demoting themselves
  if (id === auth.session.id) {
    return Response.json({ error: "Não podes editar a tua própria conta" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 422 });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.adminRole !== undefined ? { adminRole: parsed.data.adminRole as never } : {}),
        ...(parsed.data.adminCargo !== undefined ? { adminCargo: parsed.data.adminCargo } : {}),
        ...(parsed.data.adminPhone !== undefined ? { adminPhone: parsed.data.adminPhone } : {}),
        ...(parsed.data.adminEmail !== undefined ? { adminEmail: parsed.data.adminEmail } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
      select: { id: true, email: true, adminRole: true, adminCargo: true, isActive: true },
    });
    return Response.json(updated);
  } catch (err) {
    console.error("[PATCH /api/admin/admins/[id]]", err);
    return Response.json({ error: "Erro ao actualizar admin" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMaster();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  if (id === auth.session.id) {
    return Response.json({ error: "Não podes desativar a tua própria conta" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id, role: "ADMIN" },
    select: { id: true, adminRole: true },
  });
  if (!target) return Response.json({ error: "Admin não encontrado" }, { status: 404 });

  // Prevent deleting master (adminRole === null)
  if (target.adminRole === null) {
    return Response.json({ error: "Não é possível desativar outro master" }, { status: 403 });
  }

  try {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/admins/[id]]", err);
    return Response.json({ error: "Erro ao desativar admin" }, { status: 500 });
  }
}
