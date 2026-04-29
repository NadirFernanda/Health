import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const reservas = await prisma.reservaSala.findMany({
    where: { profissionalId: prof.id },
    include: { sala: { include: { clinica: true, consultorio: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    reservas.map((r) => ({
      id: r.id,
      estado: r.estado,
      codigoQr: r.codigoQr,
      data: r.data.toISOString(),
      horaInicio: r.horaInicio,
      duracaoHoras: r.duracaoHoras,
      valorTotal: r.valorTotal,
      valorTotalCentavos: r.valorTotalCentavos?.toString() ?? null,
      criadoEm: r.criadoEm.toISOString(),
      sala: {
        id: r.sala.id,
        nome: r.sala.nome,
        tipo: r.sala.tipo,
        zona: r.sala.zona,
        proprietario: r.sala.clinica
          ? { id: r.sala.clinica.id, nome: r.sala.clinica.nome, cidade: r.sala.clinica.cidade }
          : r.sala.consultorio
          ? { id: r.sala.consultorio.id, nome: r.sala.consultorio.nome, cidade: r.sala.consultorio.cidade }
          : null,
      },
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { salaId, data, horaInicio, duracaoHoras } = await request.json();
  if (!salaId || !data || !horaInicio || !duracaoHoras) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const sala = await prisma.sala.findUnique({ where: { id: salaId } });
  if (!sala || !sala.disponivel) {
    return Response.json({ error: "Sala não disponível" }, { status: 400 });
  }

  const valorTotal = sala.precoPorHora * duracaoHoras;
  const valorTotalCentavos = BigInt(sala.precoPorHora) * BigInt(duracaoHoras) * 100n;
  const reserva = await prisma.reservaSala.create({
    data: {
      salaId,
      profissionalId: prof.id,
      data: new Date(data),
      horaInicio,
      duracaoHoras,
      valorTotal,
      valorTotalCentavos,
    },
  });

  return Response.json({ id: reserva.id, codigoQr: reserva.codigoQr, valorTotal, valorTotalCentavos: valorTotalCentavos.toString() }, { status: 201 });
}
