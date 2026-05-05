import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { criarNotificacaoComPush } from "@/lib/push";

const resolveSchema = z.object({
  estado: z.enum(["EM_ANALISE", "RESOLVIDA", "ENCERRADA"]),
  resolucaoNota: z.string().min(10).max(2000).optional(),
  ajusteValorKz: z.number().int().optional(),
  ajusteParaUserId: z.string().optional(),
  mensagem: z.string().min(1).max(2000).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminAccess("disputas", "read");
  if (auth instanceof Response) return auth;

  const disputa = await prisma.disputa.findUnique({
    where: { id },
    include: {
      iniciadoPor: { select: { id: true, role: true } },
      candidatura: {
        include: {
          profissional: { select: { nome: true, userId: true, saldoCarteira: true } },
          plantao: {
            select: {
              especialidade: true, dataInicio: true, valorKwanzas: true,
              clinica: { select: { nome: true, userId: true } },
              profissionalPublicador: { select: { nome: true } },
            },
          },
        },
      },
      mensagens: {
        include: { autor: { select: { id: true, role: true } } },
        orderBy: { criadoEm: "asc" },
      },
    },
  });

  if (!disputa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(disputa);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminAccess("disputas", "write");
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { estado, resolucaoNota, ajusteValorKz, ajusteParaUserId, mensagem } = parsed.data;

  const disputa = await prisma.disputa.findUnique({
    where: { id },
    include: {
      candidatura: {
        include: {
          profissional: { select: { id: true, userId: true, nome: true } },
          plantao: { select: { clinica: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!disputa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.disputa.update({
      where: { id },
      data: {
        estado,
        resolucaoNota: resolucaoNota ?? undefined,
        ajusteValorKz: ajusteValorKz ?? undefined,
        ajusteParaId: ajusteParaUserId ?? undefined,
        resolvidoEm: estado === "RESOLVIDA" || estado === "ENCERRADA" ? new Date() : undefined,
      },
    });

    if (mensagem) {
      await tx.disputaMensagem.create({
        data: { disputaId: id, autorId: session.id, corpo: mensagem },
      });
    }

    // Apply financial adjustment if resolving with an amount
    if (estado === "RESOLVIDA" && ajusteValorKz && ajusteParaUserId) {
      const profissional = await tx.profissional.findUnique({ where: { userId: ajusteParaUserId } });
      if (profissional) {
        await tx.profissional.update({
          where: { id: profissional.id },
          data: { saldoCarteira: { increment: ajusteValorKz } },
        });
        await tx.transacaoCarteira.create({
          data: {
            profissionalId: profissional.id,
            tipo: ajusteValorKz > 0 ? "CREDITO" : "DEBITO",
            descricao: `Ajuste por resolução de disputa #${id.slice(0, 8)}`,
            valorCentavos: BigInt(Math.abs(ajusteValorKz) * 100),
            referencia: id,
          },
        });
      }
    }

    // Notify both parties
    const medicoUserId = disputa.candidatura.profissional.userId;
    const clinicaUserId = disputa.candidatura.plantao.clinica?.userId;
    const estadoLabel = estado === "RESOLVIDA" ? "resolvida" : estado === "ENCERRADA" ? "encerrada" : "em análise";

    if (medicoUserId) {
      await criarNotificacaoComPush(tx, {
        userId: medicoUserId,
        tipo: "DISPUTA",
        titulo: `Disputa ${estadoLabel}`,
        corpo: resolucaoNota ?? `A tua disputa foi marcada como ${estadoLabel}.`,
        href: `/medico/disputas/${id}`,
      });
    }
    if (clinicaUserId) {
      await criarNotificacaoComPush(tx, {
        userId: clinicaUserId,
        tipo: "DISPUTA",
        titulo: `Disputa ${estadoLabel}`,
        corpo: resolucaoNota ?? `A disputa foi marcada como ${estadoLabel}.`,
        href: `/clinica/disputas/${id}`,
      });
    }
  });

  return NextResponse.json({ ok: true });
}
