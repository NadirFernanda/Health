import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { createAuditLog } from "@/lib/audit-logger";

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
      // Approve all still-pending documents
      prisma.documento.updateMany({
        where: { profissionalId: id, estado: "PENDENTE" },
        data: { estado: "APROVADO" },
      }),
      prisma.profissional.update({
        where: { id },
        data: {
          verified: true,
          estadoVerificacao: "APROVADO",
          verificadoEm: new Date(),
          rejeicaoMotivo: null,
        },
      }),
      prisma.user.update({
        where: { id: profissional.userId },
        data: { isActive: true, verifiedAt: new Date() },
      }),
      prisma.notificacao.create({
        data: {
          userId: profissional.userId,
          tipo: "VERIFICACAO_CONCLUIDA",
          titulo: "Perfil verificado!",
          corpo: "Os teus documentos foram analisados e aprovados. Já podes candidatar-te a plantões.",
          href: "/medico/perfil",
        },
      }),
    ]);
    sendPushToUser(profissional.userId, {
      title: "Perfil verificado!",
      body: "Os teus documentos foram aprovados. Já podes candidatar-te a plantões.",
      href: "/medico/perfil",
      tag: "VERIFICACAO",
    }).catch(() => {});
  } else if (acao === "REJEITAR") {
    const motivoFinal = motivo?.trim() || "Documentos ou credenciais não estão em conformidade.";
    await prisma.$transaction([
      // Mark all pending documents as rejected
      prisma.documento.updateMany({
        where: { profissionalId: id, estado: "PENDENTE" },
        data: { estado: "REJEITADO" },
      }),
      prisma.profissional.update({
        where: { id },
        data: {
          verified: false,
          estadoVerificacao: "REJEITADO",
          rejeicaoMotivo: motivoFinal,
        },
      }),
      prisma.notificacao.create({
        data: {
          userId: profissional.userId,
          tipo: "VERIFICACAO_RECUSADA",
          titulo: "Verificação recusada",
          corpo: `Os teus documentos foram recusados. Motivo: ${motivoFinal}. Podes reenviar documentos corrigidos.`,
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

  await createAuditLog("admin_verificacao_profissional", {
    entity: "Profissional",
    entityId: id,
    acao,
    motivo: (body as { motivo?: string }).motivo ?? null,
    nome: profissional.nome,
  }, auth.session.id);

  return Response.json({ ok: true });
}
