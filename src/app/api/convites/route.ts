import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const isoDate = z.string().refine((s) => !isNaN(new Date(s).getTime()), "Data inválida");

const criarConviteSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("CLINICA_PARA_MEDICO"),
    profissionalDestinatarioId: z.string().min(1),
    especialidade: z.string().min(2).max(100),
    dataInicio: isoDate,
    dataFim: isoDate,
    valorKwanzas: z.number().int().min(500),
    mensagem: z.string().max(1000).optional(),
  }),
  z.object({
    tipo: z.literal("MEDICO_PARA_MEDICO"),
    profissionalDestinatarioId: z.string().min(1),
    especialidade: z.string().min(2).max(100),
    dataInicio: isoDate,
    dataFim: isoDate,
    valorKwanzas: z.number().int().min(500),
    mensagem: z.string().max(1000).optional(),
  }),
  z.object({
    tipo: z.literal("MEDICO_PARA_CONSULTORIO"),
    consultorioDestinatarioId: z.string().min(1),
    salaId: z.string().min(1),
    dataInicio: isoDate,
    duracaoHoras: z.number().int().min(1).max(12),
    mensagem: z.string().max(1000).optional(),
  }),
]);

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const direcao = searchParams.get("direcao") ?? "recebidos";

  if (session.role === "MEDICO") {
    const prof = await prisma.profissional.findUnique({ where: { userId: session.id } });
    if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

    if (direcao === "enviados") {
      const convites = await prisma.convite.findMany({
        where: { profissionalRemetenteId: prof.id },
        include: {
          profissionalDestinatario: { select: { id: true, nome: true, especialidade: true, foto: true, verified: true } },
          consultorioDestinatario: { select: { id: true, nome: true, bairro: true, cidade: true } },
          sala: { select: { id: true, nome: true, tipo: true } },
        },
        orderBy: { criadoEm: "desc" },
      });
      return Response.json(convites);
    } else {
      const convites = await prisma.convite.findMany({
        where: { profissionalDestinatarioId: prof.id },
        include: {
          clinicaRemetente: { select: { id: true, nome: true, logo: true, cidade: true, verified: true } },
          profissionalRemetente: { select: { id: true, nome: true, especialidade: true, foto: true, verified: true } },
          sala: { select: { id: true, nome: true, tipo: true } },
        },
        orderBy: { criadoEm: "desc" },
      });
      return Response.json(convites);
    }
  }

  if (session.role === "CLINICA") {
    const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
    if (!clinica) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

    const convites = await prisma.convite.findMany({
      where: { clinicaRemetenteId: clinica.id },
      include: {
        profissionalDestinatario: { select: { id: true, nome: true, especialidade: true, foto: true, verified: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
    return Response.json(convites);
  }

  if (session.role === "PROPRIETARIO_SALA") {
    const consultorio = await prisma.consultorio.findUnique({ where: { userId: session.id } });
    if (!consultorio) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

    const convites = await prisma.convite.findMany({
      where: { consultorioDestinatarioId: consultorio.id },
      include: {
        profissionalRemetente: { select: { id: true, nome: true, especialidade: true, foto: true, verified: true } },
        sala: { select: { id: true, nome: true, tipo: true, precoPorHora: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
    return Response.json(convites);
  }

  return Response.json({ error: "Não autorizado" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = criarConviteSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const data = parsed.data;

  if (data.tipo === "CLINICA_PARA_MEDICO") {
    if (session.role !== "CLINICA") return Response.json({ error: "Apenas clínicas podem enviar este tipo de convite" }, { status: 403 });
    const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
    if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

    const dest = await prisma.profissional.findUnique({ where: { id: data.profissionalDestinatarioId } });
    if (!dest) return Response.json({ error: "Médico não encontrado" }, { status: 404 });

    const existente = await prisma.convite.findFirst({
      where: { clinicaRemetenteId: clinica.id, profissionalDestinatarioId: dest.id, estado: "PENDENTE" },
    });
    if (existente) return Response.json({ error: "Já tens um convite pendente para este profissional" }, { status: 409 });

    const convite = await prisma.convite.create({
      data: {
        tipo: "CLINICA_PARA_MEDICO",
        clinicaRemetenteId: clinica.id,
        profissionalDestinatarioId: dest.id,
        especialidade: data.especialidade,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        valorKwanzas: data.valorKwanzas,
        mensagem: data.mensagem ?? null,
      },
    });
    return Response.json(convite, { status: 201 });
  }

  if (data.tipo === "MEDICO_PARA_MEDICO") {
    if (session.role !== "MEDICO") return Response.json({ error: "Apenas médicos podem enviar este tipo de convite" }, { status: 403 });
    const prof = await prisma.profissional.findUnique({ where: { userId: session.id } });
    if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });
    if (prof.id === data.profissionalDestinatarioId) return Response.json({ error: "Não podes convidar-te a ti mesmo" }, { status: 400 });

    const dest = await prisma.profissional.findUnique({ where: { id: data.profissionalDestinatarioId } });
    if (!dest) return Response.json({ error: "Médico não encontrado" }, { status: 404 });

    const existente = await prisma.convite.findFirst({
      where: { profissionalRemetenteId: prof.id, profissionalDestinatarioId: dest.id, estado: "PENDENTE" },
    });
    if (existente) return Response.json({ error: "Já tens um convite pendente para este profissional" }, { status: 409 });

    const convite = await prisma.convite.create({
      data: {
        tipo: "MEDICO_PARA_MEDICO",
        profissionalRemetenteId: prof.id,
        profissionalDestinatarioId: dest.id,
        especialidade: data.especialidade,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        valorKwanzas: data.valorKwanzas,
        mensagem: data.mensagem ?? null,
      },
    });
    return Response.json(convite, { status: 201 });
  }

  if (data.tipo === "MEDICO_PARA_CONSULTORIO") {
    if (session.role !== "MEDICO") return Response.json({ error: "Apenas médicos podem enviar este tipo de convite" }, { status: 403 });
    const prof = await prisma.profissional.findUnique({ where: { userId: session.id } });
    if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

    const sala = await prisma.sala.findUnique({ where: { id: data.salaId }, include: { consultorio: true } });
    if (!sala || !sala.disponivel) return Response.json({ error: "Sala não disponível" }, { status: 400 });
    if (!sala.consultorioId) return Response.json({ error: "Sala não pertence a um consultório" }, { status: 400 });

    const existente = await prisma.convite.findFirst({
      where: { profissionalRemetenteId: prof.id, salaId: data.salaId, estado: "PENDENTE" },
    });
    if (existente) return Response.json({ error: "Já tens um pedido pendente para esta sala" }, { status: 409 });

    const convite = await prisma.convite.create({
      data: {
        tipo: "MEDICO_PARA_CONSULTORIO",
        profissionalRemetenteId: prof.id,
        consultorioDestinatarioId: sala.consultorioId,
        salaId: data.salaId,
        dataInicio: new Date(data.dataInicio),
        duracaoHoras: data.duracaoHoras,
        mensagem: data.mensagem ?? null,
      },
    });
    return Response.json(convite, { status: 201 });
  }

  return Response.json({ error: "Tipo inválido" }, { status: 400 });
}
