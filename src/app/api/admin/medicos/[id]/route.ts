import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess("profissionais", "write");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const body = await request.json();
  const { acao, motivo } = body as { acao: string; motivo?: string };

  if (!["APROVAR", "REJEITAR", "SUSPENDER", "REATIVAR"].includes(acao)) {
    return Response.json({ error: "Ação inválida" }, { status: 400 });
  }

  const profissional = await prisma.profissional.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!profissional) {
    return Response.json({ error: "Profissional não encontrado" }, { status: 404 });
  }

  if (acao === "APROVAR") {
    await prisma.$transaction([
      prisma.profissional.update({
        where: { id },
        data: { verified: true, verificadoEm: new Date(), rejeicaoMotivo: null },
      }),
      prisma.user.update({
        where: { id: profissional.userId },
        data: { isActive: true, verifiedAt: new Date() },
      }),
      prisma.notificacao.create({
        data: {
          userId: profissional.userId,
          tipo: "VERIFICACAO_CONCLUIDA",
          titulo: "Verificação concluída",
          corpo: "A sua verificação foi aprovada. Já pode candidatar-se a turnos e usar todas as funcionalidades da plataforma.",
          href: "/medico/perfil",
        },
      }),
    ]);
    sendPushToUser(profissional.userId, {
      title: "Verificação concluída",
      body: "A sua verificação foi aprovada. Já pode candidatar-se a turnos.",
      href: "/medico/perfil",
      tag: "VERIFICACAO",
    }).catch(() => {});
  } else if (acao === "REJEITAR") {
    const motivoFinal = motivo?.trim() || "Documentos ou credenciais não estão em conformidade.";
    await prisma.$transaction([
      prisma.profissional.update({
        where: { id },
        data: { verified: false, rejeicaoMotivo: motivoFinal },
      }),
      prisma.notificacao.create({
        data: {
          userId: profissional.userId,
          tipo: "VERIFICACAO_RECUSADA",
          titulo: "Verificação recusada",
          corpo: `A sua verificação foi recusada. Motivo: ${motivoFinal}`,
          href: "/medico/perfil",
        },
      }),
    ]);
    sendPushToUser(profissional.userId, {
      title: "Verificação recusada",
      body: `Motivo: ${motivoFinal}`,
      href: "/medico/perfil",
      tag: "VERIFICACAO",
    }).catch(() => {});
  } else if (acao === "SUSPENDER") {
    await prisma.user.update({
      where: { id: profissional.userId },
      data: { isActive: false },
    });
  } else if (acao === "REATIVAR") {
    await prisma.user.update({
      where: { id: profissional.userId },
      data: { isActive: true },
    });
  }

  return Response.json({ ok: true });
}
