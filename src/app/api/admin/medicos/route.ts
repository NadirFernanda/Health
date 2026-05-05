import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  try {
    const medicos = await prisma.profissional.findMany({
      orderBy: { user: { criadoEm: "desc" } },
      include: {
        user: { select: { email: true, criadoEm: true, isActive: true } },
        credenciais: { select: { estado: true, express: true } },
        documentos: { select: { id: true, tipo: true, ficheiro: true, estado: true } },
      },
    });

    return Response.json(
      medicos.map((m) => {
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
          estadoVerificacao: m.verified
            ? !m.user.isActive
              ? "SUSPENSO"
              : "APROVADO"
            : "PENDENTE",
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
      })
    );
  } catch (error) {
    console.error("Erro ao listar médicos para admin:", error);
    return Response.json({ error: "Falha interna ao carregar profissionais." }, { status: 500 });
  }
}
