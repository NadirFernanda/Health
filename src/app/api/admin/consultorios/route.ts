import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const auth = await requireSession("ADMIN");
    if (auth instanceof Response) return auth;

    const consultorios = await prisma.consultorio.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        user: { select: { email: true, isActive: true } },
        _count: { select: { salas: true } },
      },
    });

    return Response.json(
      consultorios.map((c) => ({
        id: c.id,
        userId: c.userId,
        nome: c.nome,
        email: c.user.email,
        morada: c.morada ?? "",
        bairro: c.bairro ?? "",
        zonaLuanda: c.zonaLuanda ?? "",
        cidade: c.cidade ?? "",
        provincia: c.provincia,
        contacto: c.contacto ?? "",
        rating: c.rating,
        totalAvaliacoes: c.totalAvaliacoes,
        totalSalas: c._count.salas,
        verified: c.verified,
        isActive: c.user.isActive,
        estadoVerificacao: c.verified
          ? !c.user.isActive ? "SUSPENSO" : "APROVADO"
          : "PENDENTE",
        criadoEm: c.criadoEm.toISOString(),
      }))
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: "Falha interna ao carregar consultórios.", details: errorMsg },
      { status: 500 }
    );
  }
}
