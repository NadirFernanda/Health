import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const auth = await requireAdminAccess("profissionais", "read");
    if (auth instanceof Response) {
      console.warn("[GET /api/admin/clinicas] Falha de autenticação");
      return auth;
    }

    console.log("[GET /api/admin/clinicas] Permissão de leitura de profissionais validada");

    const clinicas = await prisma.clinica.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        user: { select: { email: true, isActive: true } },
        _count: { select: { plantoes: true, salas: true } },
        documentos: { select: { id: true, tipo: true, estado: true, ficheiro: true } },
      },
    });

    console.log(`[GET /api/admin/clinicas] Encontradas ${clinicas.length} clínicas`);

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
        estadoVerificacao: !c.user.isActive && c.verified
          ? "SUSPENSO"
          : c.estadoVerificacao,
        documentos: c.documentos,
        criadoEm: c.criadoEm.toISOString(),
      }))
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[GET /api/admin/clinicas] Erro interno:", { errorMsg, stack });
    return Response.json(
      { error: "Falha interna ao carregar clínicas.", details: errorMsg },
      { status: 500 }
    );
  }
}
