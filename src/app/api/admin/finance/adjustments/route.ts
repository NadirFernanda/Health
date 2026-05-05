import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { z } from "zod";
import { adjustWalletOrRevenue } from "@/lib/payment-service";

const adjustmentSchema = z.object({
  profissionalId: z.string(),
  tipo: z.enum(["CARTEIRA", "RECEITA"]),
  valorKz: z.number().int(),
  motivo: z.string().min(10).max(1000),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);
  const parsed = adjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const { profissionalId, tipo, valorKz, motivo } = parsed.data;
  try {
    const result = await adjustWalletOrRevenue(profissionalId, tipo, valorKz, `${tipo === "CARTEIRA" ? "Ajuste de Carteira" : "Ajuste de Receita"}`, motivo, auth.session.id);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: (error as Error).message ?? "Erro ao ajustar" }, { status: 500 });
  }
}
