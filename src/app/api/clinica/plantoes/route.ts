import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function plantaoToJson(p: {
  id: string; tipoProfissional: string; especialidade: string; dataInicio: Date; dataFim: Date; valorKwanzas: number;
  salaId: string | null;
  vagas: number; vagasPreenchidas: number; estado: string; descricao: string | null;
  maca: boolean; estetoscopio: boolean; tensiometro: boolean; termometro: boolean; computador: boolean;
  materiaisBasicos: boolean; nebulizador: boolean; oximetro: boolean; glucometro: boolean; desfibrilador: boolean;
  _count: { candidaturas: number };
}) {
  return {
    id: p.id,
    tipoProfissional: p.tipoProfissional,
    especialidade: p.especialidade,
    salaId: p.salaId,
    dataInicio: p.dataInicio.toISOString(),
    dataFim: p.dataFim.toISOString(),
    valorKwanzas: p.valorKwanzas,
    vagas: p.vagas,
    vagasPreenchidas: p.vagasPreenchidas,
    estado: p.estado,
    descricao: p.descricao ?? "",
    candidatos: p._count.candidaturas,
    equipamentos: {
      maca: p.maca, estetoscopio: p.estetoscopio, tensiometro: p.tensiometro,
      termometro: p.termometro, computador: p.computador, materiaisBasicos: p.materiaisBasicos,
      nebulizador: p.nebulizador, oximetro: p.oximetro, glucometro: p.glucometro, desfibrilador: p.desfibrilador,
    },
  };
}

export async function GET() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const plantoes = await prisma.plantao.findMany({
    where: { clinicaId: clinica.id },
    include: { _count: { select: { candidaturas: true } } },
    orderBy: { dataInicio: "desc" },
  });

  return Response.json(plantoes.map(plantaoToJson));
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const body = await request.json();
  const { tipoProfissional, especialidade, dataInicio, dataFim, valorKwanzas, vagas, descricao, salaId, equipamentos } = body;

  if (!especialidade || !dataInicio || !dataFim || !valorKwanzas || !vagas) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const plantao = await prisma.plantao.create({
    data: {
      clinicaId: clinica.id,
      tipoProfissional: tipoProfissional ?? "MEDICO",
      especialidade,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      valorKwanzas: parseInt(valorKwanzas),
      valorCentavos: BigInt(parseInt(valorKwanzas)) * 100n,
      vagas: parseInt(vagas),
      descricao,
      salaId: salaId ?? null,
      ...(equipamentos ?? {}),
    },
  });

  return Response.json({ id: plantao.id }, { status: 201 });
}
