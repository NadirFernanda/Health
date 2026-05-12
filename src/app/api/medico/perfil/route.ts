import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  disponivelAgora: z.boolean().optional(),
  nome: z.string().min(3).max(120).optional(),
  bio: z.string().max(1000).optional(),
  subEspecialidade: z.string().max(100).optional(),
  anosExperiencia: z.number().int().min(0).max(60).optional(),
});

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  return Response.json({
    id: prof.id,
    nome: prof.nome,
    tipo: prof.tipo,
    especialidade: prof.especialidade,
    subEspecialidade: prof.subEspecialidade ?? "",
    anosExperiencia: prof.anosExperiencia ?? 0,
    numeroOrdem: prof.numeroOrdem ?? "",
    numeroSinome: prof.numeroSinome ?? "",
    numeroOma: prof.numeroOma ?? "",
    provincia: prof.provincia,
    foto: prof.foto ?? "",
    bio: prof.bio ?? "",
    rating: prof.rating,
    totalAvaliacoes: prof.totalAvaliacoes,
    totalPlantoes: prof.totalPlantoes,
    verified: prof.verified,
    estadoVerificacao: prof.estadoVerificacao,
    rejeicaoMotivo: prof.rejeicaoMotivo ?? "",
    saldoCarteira: prof.saldoCarteira,
    saldoCentavos: prof.saldoCarteiraCentavos.toString(),
    disponivelAgora: prof.disponivelAgora,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const { disponivelAgora, nome, bio, subEspecialidade, anosExperiencia } = parsed.data;

  const updated = await prisma.profissional.update({
    where: { id: prof.id },
    data: {
      ...(disponivelAgora !== undefined && { disponivelAgora }),
      ...(nome !== undefined && { nome: nome.trim() }),
      ...(bio !== undefined && { bio }),
      ...(subEspecialidade !== undefined && { subEspecialidade }),
      ...(anosExperiencia !== undefined && { anosExperiencia }),
    },
  });

  return Response.json({ disponivelAgora: updated.disponivelAgora });
}
