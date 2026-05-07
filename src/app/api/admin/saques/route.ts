import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { checkModuleAccess } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const canAccess = await checkModuleAccess(session.id, (session as { adminRole?: string | null }).adminRole ?? null, "financeiro", "read");
  if (!canAccess) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const saques = await prisma.pedidoSaque.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      profissional: {
        select: { id: true, nome: true, especialidade: true, user: { select: { email: true } } },
      },
    },
  });

  return NextResponse.json(
    saques.map((s) => ({
      id: s.id,
      estado: s.estado,
      valorAoa: s.valorAoa,
      dadosBancarios: s.dadosBancarios,
      motivoRejeicao: s.motivoRejeicao,
      adminId: s.adminId,
      criadoEm: s.criadoEm.toISOString(),
      processadoEm: s.processadoEm?.toISOString() ?? null,
      profissional: {
        id: s.profissional.id,
        nome: s.profissional.nome,
        especialidade: s.profissional.especialidade,
        email: s.profissional.user.email,
      },
    }))
  );
}
