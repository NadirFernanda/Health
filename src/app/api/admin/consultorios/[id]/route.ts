import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = await request.json();
  const { acao } = body as { acao: string };

  if (!["APROVAR", "REJEITAR", "SUSPENDER", "REATIVAR"].includes(acao)) {
    return Response.json({ error: "Ação inválida" }, { status: 400 });
  }

  const consultorio = await prisma.consultorio.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!consultorio) {
    return Response.json({ error: "Consultório não encontrado" }, { status: 404 });
  }

  if (acao === "APROVAR") {
    await prisma.$transaction([
      prisma.consultorio.update({ where: { id }, data: { verified: true } }),
      prisma.user.update({
        where: { id: consultorio.userId },
        data: { isActive: true, verifiedAt: new Date() },
      }),
    ]);
  } else if (acao === "REJEITAR") {
    await prisma.consultorio.update({ where: { id }, data: { verified: false } });
  } else if (acao === "SUSPENDER") {
    await prisma.user.update({ where: { id: consultorio.userId }, data: { isActive: false } });
  } else if (acao === "REATIVAR") {
    await prisma.user.update({ where: { id: consultorio.userId }, data: { isActive: true } });
  }

  return Response.json({ ok: true });
}
