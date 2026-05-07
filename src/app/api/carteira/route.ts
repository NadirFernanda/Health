import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const prof = await prisma.profissional.findUnique({
    where: { userId: session.id },
    select: {
      id: true,
      saldoCarteira: true,
      saldoCarteiraCentavos: true,
      transacoes: {
        orderBy: { criadoEm: "desc" },
        take: 50,
        select: {
          id: true,
          tipo: true,
          descricao: true,
          estado: true,
          criadoEm: true,
          valorCentavos: true,
          referencia: true,
        },
      },
      saques: {
        orderBy: { criadoEm: "desc" },
        take: 20,
        select: {
          id: true,
          valorAoa: true,
          estado: true,
          dadosBancarios: true,
          motivoRejeicao: true,
          criadoEm: true,
          processadoEm: true,
        },
      },
    },
  });

  if (!prof) return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });

  const saldoCentavos = Number(prof.saldoCarteiraCentavos ?? 0n);
  const saldoAoa = saldoCentavos > 0 ? saldoCentavos / 100 : (prof.saldoCarteira ?? 0);

  const pendente = prof.transacoes
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PENDENTE")
    .reduce((s, t) => s + Number(t.valorCentavos) / 100, 0);

  return NextResponse.json({
    saldo: saldoAoa,
    pendente,
    transacoes: prof.transacoes.map((t) => ({
      ...t,
      criadoEm: t.criadoEm.toISOString(),
      valorAoa: Number(t.valorCentavos) / 100,
    })),
    saques: prof.saques.map((s) => ({
      ...s,
      criadoEm: s.criadoEm.toISOString(),
      processadoEm: s.processadoEm?.toISOString() ?? null,
    })),
  });
}
