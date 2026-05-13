import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

type Periodo = "diario" | "semanal" | "mensal" | "anual";

function getRange(periodo: Periodo, ref: Date): { start: Date; end: Date } {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);

  if (periodo === "diario") {
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start: d, end };
  }
  if (periodo === "semanal") {
    const day = d.getDay(); // 0=Sun
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (periodo === "mensal") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // anual
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function buildBuckets(periodo: Periodo, start: Date, end: Date): { label: string; start: Date; end: Date }[] {
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (periodo === "diario") {
    // 24 hourly buckets
    for (let h = 0; h < 24; h++) {
      const s = new Date(start);
      s.setHours(h, 0, 0, 0);
      const e = new Date(start);
      e.setHours(h, 59, 59, 999);
      buckets.push({ label: `${String(h).padStart(2, "0")}h`, start: s, end: e });
    }
    return buckets;
  }
  if (periodo === "semanal") {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 0; i < 7; i++) {
      const s = new Date(start);
      s.setDate(start.getDate() + i);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      const dow = s.getDay();
      buckets.push({ label: days[dow], start: s, end: e });
    }
    return buckets;
  }
  if (periodo === "mensal") {
    // one bucket per day
    const cur = new Date(start);
    while (cur <= end) {
      const s = new Date(cur);
      const e = new Date(cur);
      e.setHours(23, 59, 59, 999);
      buckets.push({ label: String(s.getDate()), start: s, end: e });
      cur.setDate(cur.getDate() + 1);
    }
    return buckets;
  }
  // anual — monthly
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  for (let m = 0; m < 12; m++) {
    const s = new Date(start.getFullYear(), m, 1);
    const e = new Date(start.getFullYear(), m + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: months[m], start: s, end: e });
  }
  return buckets;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminAccess("financeiro", "read");
  if (auth instanceof Response) return auth;

  const sp = req.nextUrl.searchParams;
  const periodo = (sp.get("periodo") ?? "mensal") as Periodo;
  const referenciaStr = sp.get("referencia");
  const ref = referenciaStr ? new Date(referenciaStr) : new Date();

  const { start, end } = getRange(periodo, ref);

  const [pagamentos, saques] = await Promise.all([
    prisma.pagamento.findMany({
      where: { estado: "CONFIRMADO", pagoEm: { gte: start, lte: end } },
      select: { valorBrutoAoa: true, comissaoAoa: true, valorLiquidoAoa: true, pagoEm: true },
    }),
    prisma.pedidoSaque.findMany({
      where: { estado: "APROVADO", processadoEm: { gte: start, lte: end } },
      select: { valorAoa: true, processadoEm: true },
    }),
  ]);

  const receitaBruta = pagamentos.reduce((s, p) => s + p.valorBrutoAoa, 0);
  const comissao = pagamentos.reduce((s, p) => s + p.comissaoAoa, 0);
  const liquidoProfissionais = pagamentos.reduce((s, p) => s + p.valorLiquidoAoa, 0);
  const levantamentos = saques.reduce((s, p) => s + p.valorAoa, 0);

  const buckets = buildBuckets(periodo, start, end);

  const grafico = buckets.map((b) => {
    const entrada = pagamentos
      .filter((p) => p.pagoEm && p.pagoEm >= b.start && p.pagoEm <= b.end)
      .reduce((s, p) => s + p.comissaoAoa, 0);
    const saida = saques
      .filter((s) => s.processadoEm && s.processadoEm >= b.start && s.processadoEm <= b.end)
      .reduce((s, p) => s + p.valorAoa, 0);
    return { label: b.label, entrada, saida };
  });

  return Response.json({
    periodo,
    label: start.toLocaleDateString("pt-AO", getLabelOptions(periodo)),
    start: start.toISOString(),
    end: end.toISOString(),
    totais: { receitaBruta, comissao, liquidoProfissionais, levantamentos },
    grafico,
  });
}

function getLabelOptions(periodo: Periodo): Intl.DateTimeFormatOptions {
  if (periodo === "diario") return { day: "2-digit", month: "short", year: "numeric" };
  if (periodo === "semanal") return { day: "2-digit", month: "short" };
  if (periodo === "mensal") return { month: "long", year: "numeric" };
  return { year: "numeric" };
}
