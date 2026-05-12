import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  nome: z.string().min(3).max(120).optional(),
  morada: z.string().min(5).max(200).optional(),
  bairro: z.string().max(100).optional(),
  zonaLuanda: z.string().max(100).optional(),
  contacto: z.string().max(50).optional(),
  cidade: z.string().max(100).optional(),
  descricao: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const consultorio = await prisma.consultorio.findUnique({
    where: { userId: session.id },
    include: { user: { select: { email: true } } },
  });
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

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const { nome, morada, bairro, zonaLuanda, contacto, cidade, descricao } = parsed.data;

  const updated = await prisma.consultorio.update({
    where: { id: consultorio.id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(morada !== undefined && { morada }),
      ...(bairro !== undefined && { bairro }),
      ...(zonaLuanda !== undefined && { zonaLuanda }),
      ...(contacto !== undefined && { contacto }),
      ...(cidade !== undefined && { cidade }),
      ...(descricao !== undefined && { descricao }),
    },
  });
  return NextResponse.json({ ok: true, id: updated.id });
}
