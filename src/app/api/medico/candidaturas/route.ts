import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function plantaoToJson(p: {
  id: string;
  clinica: { id: string; nome: string; morada: string | null; cidade: string | null; provincia: string; logo: string | null; rating: number; totalAvaliacoes: number; verified: boolean };
  especialidade: string; dataInicio: Date; dataFim: Date; valorKwanzas: number; vagas: number; vagasPreenchidas: number; estado: string; descricao: string | null;
  maca: boolean; estetoscopio: boolean; tensiometro: boolean; termometro: boolean; computador: boolean; materiaisBasicos: boolean; nebulizador: boolean; oximetro: boolean; glucometro: boolean; desfibrilador: boolean;
}) {
  return {
    id: p.id,
    clinica: p.clinica,
    especialidade: p.especialidade,
    dataInicio: p.dataInicio.toISOString(),
    dataFim: p.dataFim.toISOString(),
    valorKwanzas: p.valorKwanzas,
    vagas: p.vagas,
    vagasPreenchidas: p.vagasPreenchidas,
    estado: p.estado,
    descricao: p.descricao ?? "",
    equipamentos: {
      maca: p.maca, estetoscopio: p.estetoscopio, tensiometro: p.tensiometro,
      termometro: p.termometro, computador: p.computador, materiaisBasicos: p.materiaisBasicos,
      nebulizador: p.nebulizador, oximetro: p.oximetro, glucometro: p.glucometro, desfibrilador: p.desfibrilador,
    },
  };
}

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const candidaturas = await prisma.candidatura.findMany({
    where: { profissionalId: prof.id },
    include: { plantao: { include: { clinica: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    candidaturas.map((c) => ({
      id: c.id,
      estado: c.estado,
      criadoEm: c.criadoEm.toISOString(),
      plantao: plantaoToJson(c.plantao),
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  if (!prof.verified) {
    return Response.json({ error: "Verificação Express necessária para se candidatar." }, { status: 403 });
  }

  const { plantaoId } = await request.json();
  if (!plantaoId) return Response.json({ error: "plantaoId obrigatório" }, { status: 400 });

  const plantao = await prisma.plantao.findUnique({ where: { id: plantaoId } });
  if (!plantao || plantao.estado !== "ABERTO") {
    return Response.json({ error: "Plantão não disponível" }, { status: 400 });
  }

  const existing = await prisma.candidatura.findUnique({
    where: { plantaoId_profissionalId: { plantaoId, profissionalId: prof.id } },
  });
  if (existing) return Response.json({ error: "Candidatura já submetida" }, { status: 409 });

  const candidatura = await prisma.candidatura.create({
    data: { plantaoId, profissionalId: prof.id },
  });

  return Response.json({ id: candidatura.id, estado: candidatura.estado }, { status: 201 });
}
