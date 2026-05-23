import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const acaoSchema = z.object({
  acao: z.enum(["aceitar", "recusar", "cancelar"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = acaoSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: "Ação inválida" }, { status: 400 });

  const { acao } = parsed.data;

  const convite = await prisma.convite.findUnique({
    where: { id },
    include: {
      clinicaRemetente: { select: { userId: true } },
      profissionalRemetente: { select: { userId: true } },
      profissionalDestinatario: { select: { userId: true } },
      consultorioDestinatario: { select: { userId: true } },
    },
  });

  if (!convite) return Response.json({ error: "Convite não encontrado" }, { status: 404 });
  if (convite.estado !== "PENDENTE") return Response.json({ error: "Este convite já foi respondido" }, { status: 409 });

  // Verify the user has permission for the action
  const isRemetente =
    convite.clinicaRemetente?.userId === session.id ||
    convite.profissionalRemetente?.userId === session.id;
  const isDestinatario =
    convite.profissionalDestinatario?.userId === session.id ||
    convite.consultorioDestinatario?.userId === session.id;

  if (acao === "cancelar" && !isRemetente) {
    return Response.json({ error: "Apenas o remetente pode cancelar" }, { status: 403 });
  }
  if ((acao === "aceitar" || acao === "recusar") && !isDestinatario) {
    return Response.json({ error: "Apenas o destinatário pode aceitar ou recusar" }, { status: 403 });
  }

  const novoEstado =
    acao === "aceitar" ? "ACEITE" :
    acao === "recusar" ? "RECUSADO" :
    "CANCELADO";

  const atualizado = await prisma.convite.update({
    where: { id },
    data: { estado: novoEstado, respondidoEm: new Date() },
  });

  return Response.json(atualizado);
}
