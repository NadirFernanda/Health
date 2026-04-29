import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const zona = searchParams.get("zona");
  const tipo = searchParams.get("tipo");

  const salas = await prisma.sala.findMany({
    where: {
      disponivel: true,
      ...(zona && { zona }),
      ...(tipo && { tipo: tipo as "CONSULTORIO" | "OBSERVACAO" | "PROCEDIMENTOS" }),
    },
    include: { clinica: true, consultorio: true },
    orderBy: { avaliacaoMedia: "desc" },
  });

  return Response.json(
    salas.map((s) => ({
      id: s.id,
      nome: s.nome,
      tipo: s.tipo,
      precoPorHora: s.precoPorHora,
      precoPorHoraCentavos: s.precoPorHoraCentavos?.toString() ?? null,
      zona: s.zona,
      descricao: s.descricao ?? "",
      disponivel: s.disponivel,
      avaliacaoMedia: s.avaliacaoMedia,
      totalAvaliacoes: s.totalAvaliacoes,
      clinica: s.clinica
        ? { id: s.clinica.id, nome: s.clinica.nome, cidade: s.clinica.cidade, verified: s.clinica.verified }
        : null,
      consultorio: s.consultorio
        ? { id: s.consultorio.id, nome: s.consultorio.nome, cidade: s.consultorio.cidade, verified: s.consultorio.verified }
        : null,
      proprietario: s.clinica
        ? { id: s.clinica.id, nome: s.clinica.nome, cidade: s.clinica.cidade, verified: s.clinica.verified }
        : s.consultorio
        ? { id: s.consultorio.id, nome: s.consultorio.nome, cidade: s.consultorio.cidade, verified: s.consultorio.verified }
        : null,
      equipamentos: {
        maca: s.maca, estetoscopio: s.estetoscopio, tensiometro: s.tensiometro,
        termometro: s.termometro, computador: s.computador, materiaisBasicos: s.materiaisBasicos,
        nebulizador: s.nebulizador, oximetro: s.oximetro, glucometro: s.glucometro, desfibrilador: s.desfibrilador,
      },
    }))
  );
}
