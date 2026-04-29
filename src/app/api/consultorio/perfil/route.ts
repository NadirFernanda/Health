import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Consultório não encontrado" }, { status: 404 });
  return NextResponse.json(consultorio);
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Consultório não encontrado" }, { status: 404 });

  const body = await req.json();
  const { nome, morada, bairro, zonaLuanda, contacto, cidade, descricao } = body;

  const updated = await prisma.consultorio.update({
    where: { id: consultorio.id },
    data: {
      nome: nome ?? consultorio.nome,
      morada: morada ?? consultorio.morada,
      bairro: bairro ?? consultorio.bairro,
      zonaLuanda: zonaLuanda ?? consultorio.zonaLuanda,
      contacto: contacto ?? consultorio.contacto,
      cidade: cidade ?? consultorio.cidade,
      descricao: descricao ?? consultorio.descricao,
    },
  });
  return NextResponse.json(updated);
}
