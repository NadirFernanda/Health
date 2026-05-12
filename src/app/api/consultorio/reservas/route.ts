import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import type { EstadoReserva } from "@/generated/prisma/enums";

const ESTADOS_RESERVA_VALIDOS: EstadoReserva[] = [
  "CONFIRMADA", "CANCELADA", "CONCLUIDA", "PENDENTE_PAGAMENTO",
  "CANCELADA_PROFISSIONAL", "CANCELADA_CLINICA", "AGUARDANDO_VISTORIA",
  "DISPUTA_SALA", "CONTRATO_PENDENTE",
];

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const salaId = searchParams.get("salaId");
  const estadoParam = searchParams.get("estado");
  const estadoValido = estadoParam && (ESTADOS_RESERVA_VALIDOS as string[]).includes(estadoParam)
    ? estadoParam as EstadoReserva
    : undefined;

  const reservas = await prisma.reservaSala.findMany({
    where: {
      sala: { consultorioId: consultorio.id },
      ...(salaId ? { salaId } : {}),
      ...(estadoValido ? { estado: estadoValido } : {}),
    },
    include: {
      sala: { select: { id: true, nome: true, tipo: true } },
      profissional: { select: { id: true, nome: true, especialidade: true, rating: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });

  return NextResponse.json(
    reservas.map((r) => ({
      id: r.id,
      estado: r.estado,
      data: r.data.toISOString(),
      horaInicio: r.horaInicio,
      duracaoHoras: r.duracaoHoras,
      valorTotal: r.valorTotal,
      codigoQr: r.codigoQr,
      criadoEm: r.criadoEm.toISOString(),
      terminadoEm: r.terminadoEm?.toISOString() ?? null,
      vistoriaOk: r.vistoriaOk ?? null,
      vistoriaNotas: r.vistoriaNotas ?? null,
      vistoriaEquipamentos: r.vistoriaEquipamentos ?? null,
      vistoriaEm: r.vistoriaEm?.toISOString() ?? null,
      sala: r.sala,
      profissional: r.profissional,
    }))
  );
}
