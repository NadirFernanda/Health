import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const reserva = await prisma.reservaSala.findUnique({
    where: { id },
    include: { sala: { select: { consultorioId: true } }, pagamentos: true },
  });

  if (!reserva) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  if (reserva.sala.consultorioId !== consultorio.id)
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (reserva.estado !== "AGUARDANDO_VISTORIA")
    return NextResponse.json({ error: "Reserva não está a aguardar vistoria" }, { status: 400 });

  const body = await req.json() as {
    tudo_ok: boolean;
    equipamentos: Record<string, boolean>;
    notas?: string;
  };

  const agora = new Date();
  const equipamentosJson = JSON.stringify(body.equipamentos ?? {});

  if (body.tudo_ok) {
    // Everything OK → complete and release payment
    await prisma.$transaction(async (tx) => {
      await tx.reservaSala.update({
        where: { id },
        data: {
          estado: "CONCLUIDA",
          vistoriaOk: true,
          vistoriaEquipamentos: equipamentosJson,
          vistoriaNotas: body.notas ?? null,
          vistoriaEm: agora,
          pagoEm: agora,
        },
      });

      // Release the payment record if exists
      const pagamento = reserva.pagamentos.find((p) => p.tipo === "SALA");
      if (pagamento) {
        await tx.pagamento.update({
          where: { id: pagamento.id },
          data: { estado: "CONFIRMADO", liberadoEm: agora },
        });
      }
    });

    return NextResponse.json({ estado: "CONCLUIDA", pagamentoLiberado: true });
  } else {
    // Problems found → open dispute, hold payment
    await prisma.reservaSala.update({
      where: { id },
      data: {
        estado: "DISPUTA_SALA",
        vistoriaOk: false,
        vistoriaEquipamentos: equipamentosJson,
        vistoriaNotas: body.notas ?? null,
        vistoriaEm: agora,
      },
    });

    return NextResponse.json({ estado: "DISPUTA_SALA", pagamentoLiberado: false });
  }
}
