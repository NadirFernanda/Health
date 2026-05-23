import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const METODOS = ["MULTICAIXA_EXPRESS", "TPA", "TRANSFERENCIA_BANCARIA"] as const;

const reservaSchema = z.object({
  salaId: z.string().min(1),
  data: z.string().refine((s) => {
    const d = new Date(s);
    return !isNaN(d.getTime()) && d > new Date();
  }, { message: "Data inválida ou no passado" }),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida — use HH:MM"),
  duracaoHoras: z.number().int().min(1).max(12),
  metodo: z.enum(METODOS).default("TRANSFERENCIA_BANCARIA"),
});

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const reservas = await prisma.reservaSala.findMany({
    where: { profissionalId: prof.id },
    include: {
      sala: { include: { clinica: true, consultorio: true } },
      pagamentos: { where: { estado: "CONFIRMADO" }, select: { id: true }, take: 1 },
    },
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
      pagamentoId: r.pagamentos[0]?.id ?? null,
      criadoEm: r.criadoEm.toISOString(),
      sala: {
        id: r.sala.id,
        nome: r.sala.nome,
        tipo: r.sala.tipo,
        zona: r.sala.zona,
        clinica: r.sala.clinica
          ? { id: r.sala.clinica.id, nome: r.sala.clinica.nome, cidade: r.sala.clinica.cidade ?? "" }
          : r.sala.consultorio
          ? { id: r.sala.consultorio.id, nome: r.sala.consultorio.nome, cidade: r.sala.consultorio.cidade ?? "" }
          : { id: "", nome: "–", cidade: "" },
      },
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = reservaSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const { salaId, data, horaInicio, duracaoHoras, metodo: metodoFinal } = parsed.data;

  const sala = await prisma.sala.findUnique({ where: { id: salaId } });
  if (!sala || !sala.disponivel) {
    return Response.json({ error: "Sala não disponível" }, { status: 400 });
  }

  const valorTotal = sala.precoPorHora * duracaoHoras;
  const valorTotalCentavos = BigInt(sala.precoPorHora) * BigInt(duracaoHoras) * 100n;
  const comissao = Math.round(valorTotal * 0.10);

  const { reserva, pagamento } = await prisma.$transaction(async (tx) => {
    const r = await tx.reservaSala.create({
      data: {
        salaId,
        profissionalId: prof.id,
        data: new Date(data),
        horaInicio,
        duracaoHoras,
        valorTotal,
        valorTotalCentavos,
        estado: "CONTRATO_PENDENTE",
        contratoGeradoEm: new Date(),
      },
    });
    const pag = await tx.pagamento.create({
      data: {
        tipo: "SALA",
        reservaSalaId: r.id,
        valorBrutoAoa: valorTotal,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorTotal - comissao,
        metodo: metodoFinal,
        estado: "PENDENTE",
      },
    });
    return { reserva: r, pagamento: pag };
  });

  return Response.json({
    id: reserva.id,
    codigoQr: reserva.codigoQr,
    valorTotal,
    valorTotalCentavos: valorTotalCentavos.toString(),
    pagamentoId: pagamento.id,
    estado: "CONTRATO_PENDENTE",
  }, { status: 201 });
}
