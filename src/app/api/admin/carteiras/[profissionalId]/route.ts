import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { checkModuleAccess } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profissionalId: string }> }
) {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const canAccess = await checkModuleAccess(session.id, (session as { adminRole?: string | null }).adminRole ?? null, "financeiro", "read");
  if (!canAccess) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { profissionalId } = await params;

  const prof = await prisma.profissional.findUnique({
    where: { id: profissionalId },
    select: {
      id: true,
      nome: true,
      especialidade: true,
      saldoCarteira: true,
      saldoCarteiraCentavos: true,
      user: { select: { email: true, phone: true } },
      transacoes: {
        orderBy: { criadoEm: "desc" },
        take: 100,
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
        take: 50,
        select: {
          id: true,
          valorAoa: true,
          estado: true,
          dadosBancarios: true,
          motivoRejeicao: true,
          adminId: true,
          criadoEm: true,
          processadoEm: true,
        },
      },
    },
  });

  if (!prof) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const saldoCentavos = Number(prof.saldoCarteiraCentavos ?? 0n);
  const saldo = saldoCentavos > 0 ? saldoCentavos / 100 : (prof.saldoCarteira ?? 0);

  const pendente = prof.transacoes
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PENDENTE")
    .reduce((s, t) => s + Number(t.valorCentavos) / 100, 0);

  return NextResponse.json({
    id: prof.id,
    nome: prof.nome,
    especialidade: prof.especialidade,
    email: prof.user.email,
    telefone: prof.user.phone,
    saldo,
    pendente,
    transacoes: prof.transacoes.map(({ valorCentavos, ...t }) => ({
      ...t,
      criadoEm: t.criadoEm.toISOString(),
      valorAoa: Number(valorCentavos) / 100,
    })),
    saques: prof.saques.map((s) => ({
      ...s,
      criadoEm: s.criadoEm.toISOString(),
      processadoEm: s.processadoEm?.toISOString() ?? null,
    })),
  });
}
