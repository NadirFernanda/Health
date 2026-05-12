import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  morada: z.string().min(5).max(200).optional(),
  contacto: z.string().max(50).optional(),
  website: z.union([z.url().max(200), z.literal("")]).optional(),
  descricao: z.string().max(2000).optional(),
});

export async function GET() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  return Response.json({
    id: clinica.id,
    nome: clinica.nome,
    morada: clinica.morada ?? "",
    bairro: clinica.bairro ?? "",
    cidade: clinica.cidade ?? "",
    provincia: clinica.provincia,
    zonaLuanda: clinica.zonaLuanda ?? "",
    contacto: clinica.contacto ?? "",
    website: clinica.website ?? "",
    descricao: clinica.descricao ?? "",
    logo: clinica.logo ?? "",
    rating: clinica.rating,
    totalAvaliacoes: clinica.totalAvaliacoes,
    verified: clinica.verified,
    estadoVerificacao: clinica.estadoVerificacao,
    rejeicaoMotivo: clinica.rejeicaoMotivo ?? null,
    criadoEm: clinica.criadoEm.toISOString(),
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const { morada, contacto, website, descricao } = parsed.data;

  const updated = await prisma.clinica.update({
    where: { id: clinica.id },
    data: {
      ...(morada !== undefined && { morada }),
      ...(contacto !== undefined && { contacto }),
      ...(website !== undefined && { website: website || null }),
      ...(descricao !== undefined && { descricao }),
    },
  });

  return Response.json({ ok: true, id: updated.id });
}

