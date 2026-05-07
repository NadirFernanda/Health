/**
 * POST /api/cron/atualizar-status
 *
 * Automatic plantão lifecycle transitions:
 *   ABERTO | FECHADO  →  EM_ANDAMENTO   (when dataInicio <= now AND has ACEITE candidature)
 *   EM_ANDAMENTO      →  CONCLUIDO      (when dataFim   <= now, releases escrow to wallet)
 *
 * Called by scripts/cron-worker.js every minute via pm2.
 * Secured by Authorization: Bearer <CRON_SECRET>.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { recalculateRevenueForProfessional } from "@/lib/payment-service";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const resultado = { emAndamento: 0, concluidos: 0, erros: 0 };

  // ── 1. ABERTO / FECHADO → EM_ANDAMENTO ──────────────────────────────────
  // Shift start time reached AND at least one signed candidature exists.
  const paraIniciar = await prisma.plantao.findMany({
    where: {
      estado: { in: ["ABERTO", "FECHADO"] },
      dataInicio: { lte: agora },
      candidaturas: { some: { estado: "ACEITE" } },
    },
    include: {
      clinica: { select: { userId: true } },
      candidaturas: {
        where: { estado: "ACEITE" },
        include: { profissional: { select: { userId: true, nome: true } } },
      },
    },
  });

  for (const plantao of paraIniciar) {
    try {
      await prisma.plantao.update({
        where: { id: plantao.id },
        data: { estado: "EM_ANDAMENTO" },
      });

      // Notify each accepted doctor
      for (const cand of plantao.candidaturas) {
        const uid = cand.profissional.userId;
        await prisma.notificacao.create({
          data: {
            userId: uid,
            tipo: "PLANTAO",
            titulo: "Plantão em andamento!",
            corpo: `O teu plantão de ${plantao.especialidade} começou. Boa sorte!`,
            href: `/medico/plantoes/${plantao.id}`,
          },
        });
        sendPushToUser(uid, {
          title: "Plantão em andamento!",
          body: `Plantão de ${plantao.especialidade} começou.`,
          href: `/medico/plantoes/${plantao.id}`,
          tag: "PLANTAO",
        }).catch(() => {});
      }

      // Notify clinic
      if (plantao.clinica?.userId) {
        await prisma.notificacao.create({
          data: {
            userId: plantao.clinica.userId,
            tipo: "PLANTAO",
            titulo: "Plantão em andamento",
            corpo: `O plantão de ${plantao.especialidade} está agora a decorrer.`,
            href: `/clinica/plantoes/${plantao.id}`,
          },
        });
      }

      resultado.emAndamento++;
    } catch (err) {
      console.error(`[cron] EM_ANDAMENTO failed for plantao ${plantao.id}:`, err);
      resultado.erros++;
    }
  }

  // ── 2. EM_ANDAMENTO → CONCLUIDO ─────────────────────────────────────────
  // Shift end time passed — finalise and release escrow.
  const paraConcluir = await prisma.plantao.findMany({
    where: {
      estado: "EM_ANDAMENTO",
      dataFim: { lte: agora },
    },
    include: {
      pagamentos: {
        where: { tipo: "TURNO", estado: "CONFIRMADO" },
      },
    },
  });

  for (const plantao of paraConcluir) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.plantao.update({
          where: { id: plantao.id },
          data: { estado: "CONCLUIDO" },
        });

        for (const pag of plantao.pagamentos) {
          if (!pag.beneficiarioProfissionalId) continue;

          await tx.pagamento.update({
            where: { id: pag.id },
            data: { liberadoEm: agora },
          });

          await tx.profissional.update({
            where: { id: pag.beneficiarioProfissionalId },
            data: {
              saldoCarteira: { increment: pag.valorLiquidoAoa },
              saldoCarteiraCentavos: { increment: BigInt(pag.valorLiquidoAoa) * 100n },
              totalPlantoes: { increment: 1 },
            },
          });

          await tx.transacaoCarteira.create({
            data: {
              profissionalId: pag.beneficiarioProfissionalId,
              tipo: "CREDITO",
              valorCentavos: BigInt(pag.valorLiquidoAoa) * 100n,
              descricao: `Pagamento plantão concluído — ${pag.valorLiquidoAoa.toLocaleString()} AOA`,
              referencia: plantao.id,
              estado: "PROCESSADO",
            },
          });

          await recalculateRevenueForProfessional(pag.beneficiarioProfissionalId, tx as any);

          const prof = await tx.profissional.findUnique({
            where: { id: pag.beneficiarioProfissionalId },
            select: { userId: true },
          });
          if (prof) {
            const corpo = `Recebeste ${pag.valorLiquidoAoa.toLocaleString()} AOA pelo plantão concluído. O valor está disponível na tua carteira.`;
            await tx.notificacao.create({
              data: {
                userId: prof.userId,
                tipo: "PAGAMENTO",
                titulo: "Pagamento recebido!",
                corpo,
                href: "/medico/ganhos",
              },
            });
            sendPushToUser(prof.userId, {
              title: "Pagamento recebido!",
              body: corpo,
              href: "/medico/ganhos",
              tag: "PAGAMENTO",
            }).catch(() => {});
          }
        }
      });

      resultado.concluidos++;
    } catch (err) {
      console.error(`[cron] CONCLUIDO failed for plantao ${plantao.id}:`, err);
      resultado.erros++;
    }
  }

  console.log(`[cron] ${agora.toISOString()} — EM_ANDAMENTO: ${resultado.emAndamento}, CONCLUIDOS: ${resultado.concluidos}, ERROS: ${resultado.erros}`);
  return Response.json({ sucesso: true, ...resultado, timestamp: agora.toISOString() });
}
