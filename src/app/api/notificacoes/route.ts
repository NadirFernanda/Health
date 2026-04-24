import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const notificacoes = await prisma.notificacao.findMany({
    where: { userId: session.id },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    notificacoes.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      corpo: n.corpo,
      href: n.href,
      lida: n.lida,
      criadoEm: n.criadoEm.toISOString(),
    }))
  );
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await request.json();
  const { ids, all } = body as { ids?: string[]; all?: boolean };

  if (all) {
    await prisma.notificacao.updateMany({
      where: { userId: session.id },
      data: { lida: true },
    });
  } else if (ids && ids.length > 0) {
    await prisma.notificacao.updateMany({
      where: { userId: session.id, id: { in: ids } },
      data: { lida: true },
    });
  }

  return Response.json({ ok: true });
}
