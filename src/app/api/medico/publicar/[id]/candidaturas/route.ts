import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// Comissão da plataforma: 10%
const COMISSAO_PERCENTAGEM = 0.10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;

  // Garantir que o plantão pertence a este médico
  const plantao = await prisma.plantao.findFirst({
    where: { id: plantaoId, profissionalPublicadorId: prof.id },
  });
  if (!plantao) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const candidaturas = await prisma.candidatura.findMany({
    where: { plantaoId },
    include: { profissional: true },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    candidaturas.map((c) => ({
      id: c.id,
      estado: c.estado,
      criadoEm: c.criadoEm.toISOString(),
      profissional: {
        id: c.profissional.id,
        nome: c.profissional.nome,
        tipo: c.profissional.tipo,
        especialidade: c.profissional.especialidade,
        numeroSinome: c.profissional.numeroSinome ?? "",
        rating: c.profissional.rating,
        totalAvaliacoes: c.profissional.totalAvaliacoes,
        totalPlantoes: c.profissional.totalPlantoes,
        verified: c.profissional.verified,
        bio: c.profissional.bio ?? "",
      },
    }))
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;
  const { candidaturaId, estado } = await request.json();

  if (!candidaturaId || !["ACEITE", "RECUSADO"].includes(estado)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Verificar que a candidatura pertence a um plantão publicado por este médico
  const candidatura = await prisma.candidatura.findFirst({
    where: {
      id: candidaturaId,
      plantaoId,
      plantao: { profissionalPublicadorId: prof.id },
    },
    include: { plantao: true },
  });
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await prisma.candidatura.update({
    where: { id: candidaturaId },
    data: { estado, respondidoEm: new Date() },
  });

  // Ao aceitar: criar registo de pagamento retido (escrow)
  if (estado === "ACEITE") {
    const valorBruto = candidatura.plantao.valorKwanzas;
    const comissao = Math.round(valorBruto * COMISSAO_PERCENTAGEM);
    const valorLiquido = valorBruto - comissao;

    await prisma.pagamento.create({
      data: {
        tipo: "TURNO",
        plantaoId,
        candidaturaId,
        beneficiarioProfissionalId: candidatura.profissionalId,
        valorBrutoAoa: valorBruto,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorLiquido,
        metodo: "TRANSFERENCIA_BANCARIA",
        estado: "CONFIRMADO", // retido na plataforma
      },
    });
  }

  return Response.json({ id: updated.id, estado: updated.estado });
}
