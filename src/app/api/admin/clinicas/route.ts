import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const clinicas = await prisma.clinica.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      user: { select: { email: true, isActive: true } },
      _count: { select: { plantoes: true, salas: true } },
    },
  });

  return Response.json(
    clinicas.map((c) => ({
      id: c.id,
      userId: c.userId,
      nome: c.nome,
      email: c.user.email,
      morada: c.morada ?? "",
      zonaLuanda: c.zonaLuanda ?? "",
      provincia: c.provincia,
      contacto: c.contacto ?? "",
      alvara: c.alvara ?? "",
      rating: c.rating,
      totalAvaliacoes: c.totalAvaliacoes,
      totalPlantoes: c._count.plantoes,
      totalSalas: c._count.salas,
      verified: c.verified,
      isActive: c.user.isActive,
      estadoVerificacao: c.verified
        ? !c.user.isActive
          ? "SUSPENSO"
          : "APROVADO"
        : "PENDENTE",
      criadoEm: c.criadoEm.toISOString(),
    }))
  );
}
