import { NextRequest, NextResponse } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });

  const reserva = await prisma.reservaSala.findUnique({
    where: { id },
    select: { id: true, profissionalId: true, estado: true, salaId: true },
  });

  if (!reserva) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  if (reserva.profissionalId !== prof.id)
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (reserva.estado !== "CONFIRMADA")
    return NextResponse.json({ error: "Reserva não está activa" }, { status: 400 });

  const updated = await prisma.reservaSala.update({
    where: { id },
    data: {
      estado: "AGUARDANDO_VISTORIA",
      terminadoEm: new Date(),
    },
  });

  return NextResponse.json({ id: updated.id, estado: updated.estado });
}
