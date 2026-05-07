import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const auth = await requireAdminAccess("profissionais", "read");
    if (auth instanceof Response) {
      console.warn("[GET /api/admin/medicos] Falha de autenticação");
      return auth;
    }

    console.log("[GET /api/admin/medicos] Permissão de leitura de profissionais validada");

    const medicos = await prisma.profissional.findMany({
      orderBy: { user: { criadoEm: "desc" } },
      include: {
        user: { select: { email: true, criadoEm: true, isActive: true } },
        credenciais: { select: { estado: true, express: true } },
        documentos: { select: { id: true, tipo: true, ficheiro: true, estado: true } },
      },
    });

    console.log(`[GET /api/admin/medicos] Encontrados ${medicos.length} profissionais`);

    const result = medicos.map((m) => {
      const temCredencialExpress = m.credenciais.some((c) => c.express);
      const credencialPendente = m.credenciais.some(
        (c) => c.estado === "PENDENTE" || c.estado === "EXPRESS_PENDENTE"
      );

      return {
        id: m.id,
        userId: m.userId,
        nome: m.nome,
        email: m.user.email,
        especialidade: m.especialidade,
        provincia: m.provincia,
        numeroOrdem: m.numeroOrdem ?? "",
        rating: m.rating,
        totalAvaliacoes: m.totalAvaliacoes,
        totalPlantoes: m.totalPlantoes,
        verified: m.verified,
        isActive: m.user.isActive,
        estadoVerificacao: !m.user.isActive && m.verified
          ? "SUSPENSO"
          : m.estadoVerificacao,
        tipoVerificacao: temCredencialExpress ? "EXPRESS" : "NORMAL",
        documentos: m.documentos
          .filter((doc) => doc.ficheiro && doc.estado !== "NAO_ENVIADO")
          .map((doc) => ({
            id: doc.id,
            tipo: doc.tipo,
            estado: doc.estado,
            ficheiro: doc.ficheiro!,
          })),
        rejeicaoMotivo: m.rejeicaoMotivo ?? "",
        saldoCarteira: m.saldoCarteira,
        criadoEm: m.user.criadoEm.toISOString(),
      };
    });

    console.log("[GET /api/admin/medicos] Resposta mapeada com sucesso");
    return Response.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[GET /api/admin/medicos] Erro interno:", { errorMsg, stack });
    return Response.json(
      { error: "Falha interna ao carregar profissionais.", details: errorMsg },
      { status: 500 }
    );
  }
}
