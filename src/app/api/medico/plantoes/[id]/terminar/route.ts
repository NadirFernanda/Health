import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;

  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;

  const candidatura = await prisma.candidatura.findUnique({
    where: { plantaoId_profissionalId: { plantaoId, profissionalId: prof.id } },
    include: { plantao: { include: { clinica: true } } },
  });

  if (!candidatura) return Response.json({ error: "Candidatura não encontrada" }, { status: 404 });
  if (candidatura.estado !== "ACEITE") {
    return Response.json({ error: "Só podes terminar um plantão que tenhas aceite" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidatura.update({
      where: { id: candidatura.id },
      data: { estado: "CONCLUIDO" },
    });

    if (candidatura.plantao.clinica?.userId) {
      await criarNotificacaoComPush(tx, {
        userId: candidatura.plantao.clinica.userId,
        tipo: "PAGAMENTO",
        titulo: "Plantão terminado — liberar pagamento",
        corpo: `${prof.nome} terminou o plantão de ${candidatura.plantao.especialidade}. Podes agora liberar o pagamento.`,
        href: `/clinica/plantoes/${plantaoId}`,
      });
    }
  });

  return Response.json({ estado: "CONCLUIDO" });
}
