import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { checkModuleAccess } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const canAccess = await checkModuleAccess(session.id, (session as { adminRole?: string | null }).adminRole ?? null, "financeiro", "read");
  if (!canAccess) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const profissionais = await prisma.profissional.findMany({
    orderBy: { saldoCarteira: "desc" },
    select: {
      id: true,
      nome: true,
      especialidade: true,
      saldoCarteira: true,
      saldoCarteiraCentavos: true,
      user: { select: { email: true } },
      _count: { select: { saques: { where: { estado: "PENDENTE" } } } },
    },
  });

  return NextResponse.json(
    profissionais.map((p) => ({
      id: p.id,
      nome: p.nome,
      especialidade: p.especialidade,
      email: p.user.email,
      saldo: Number(p.saldoCarteiraCentavos ?? 0n) > 0
        ? Number(p.saldoCarteiraCentavos) / 100
        : (p.saldoCarteira ?? 0),
      saquesPendentes: p._count.saques,
    }))
  );
}
