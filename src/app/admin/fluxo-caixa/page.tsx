"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Banknote, Percent } from "lucide-react";

type Periodo = "diario" | "semanal" | "mensal" | "anual";

type Grafico = { label: string; entrada: number; saida: number };
type Totais = { receitaBruta: number; comissao: number; liquidoProfissionais: number; levantamentos: number };
type Dados = { periodo: Periodo; label: string; start: string; end: string; totais: Totais; grafico: Grafico[] };

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "diario",  label: "Hoje" },
  { key: "semanal", label: "Semana" },
  { key: "mensal",  label: "Mês" },
  { key: "anual",   label: "Ano" },
];

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function shiftRef(periodo: Periodo, ref: Date, delta: number): Date {
  const d = new Date(ref);
  if (periodo === "diario")  d.setDate(d.getDate() + delta);
  if (periodo === "semanal") d.setDate(d.getDate() + delta * 7);
  if (periodo === "mensal")  d.setMonth(d.getMonth() + delta);
  if (periodo === "anual")   d.setFullYear(d.getFullYear() + delta);
  return d;
}

function refToString(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function FluxoCaixa() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const [ref, setRef] = useState<Date>(new Date());
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (p: Periodo, r: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fluxo-caixa?periodo=${p}&referencia=${refToString(r)}`, { credentials: "include" });
      if (res.ok) setDados(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(periodo, ref); }, [periodo, ref, carregar]);

  const navegar = (delta: number) => setRef((r) => shiftRef(periodo, r, delta));
  const hoje = () => { setRef(new Date()); };

  const maxVal = dados ? Math.max(...dados.grafico.map((b) => Math.max(b.entrada, b.saida)), 1) : 1;

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Fluxo de Caixa</h1>
        <button
          onClick={hoje}
          className="text-xs font-semibold text-[#0B3C74] border border-[#0B3C74]/20 px-3 py-1.5 rounded-full hover:bg-[#0B3C74]/5 transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Período tabs */}
      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodo(p.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              periodo === p.key
                ? "bg-[#0B3C74] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
        <button
          onClick={() => navegar(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <p className="text-sm font-semibold text-gray-800 capitalize">
          {loading ? "…" : (dados?.label ?? "—")}
        </p>
        <button
          onClick={() => navegar(1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && dados && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#00A99D]/10 flex items-center justify-center">
                  <TrendingUp size={13} className="text-[#00A99D]" />
                </div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Receita Bruta</p>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-none">{formatAOA(dados.totais.receitaBruta)}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B3C74]/10 flex items-center justify-center">
                  <Percent size={13} className="text-[#0B3C74]" />
                </div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Comissão</p>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-none">{formatAOA(dados.totais.comissao)}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B3C74]/5 flex items-center justify-center">
                  <Banknote size={13} className="text-[#0B3C74]" />
                </div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Pago a Profissionais</p>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-none">{formatAOA(dados.totais.liquidoProfissionais)}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown size={13} className="text-red-400" />
                </div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Levantamentos</p>
              </div>
              <p className="text-lg font-bold text-gray-900 leading-none">{formatAOA(dados.totais.levantamentos)}</p>
            </div>
          </div>

          {/* Saldo líquido MedFreela */}
          <div className="bg-[#0B3C74] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Saldo MedFreela</p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {formatAOA(dados.totais.comissao - dados.totais.levantamentos)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Comissão − Levantamentos</p>
              {dados.totais.receitaBruta > 0 && (
                <p className="text-sm font-semibold text-white/70 mt-0.5">
                  {((dados.totais.comissao / dados.totais.receitaBruta) * 100).toFixed(1)}% margem
                </p>
              )}
            </div>
          </div>

          {/* Gráfico de barras */}
          {dados.grafico.some((b) => b.entrada > 0 || b.saida > 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">Evolução</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00A99D] inline-block" /> Comissão</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-300 inline-block" /> Levantamentos</span>
                </div>
              </div>
              <div className="flex items-end gap-px overflow-x-auto no-scrollbar" style={{ height: 100 }}>
                {dados.grafico.map((b, i) => (
                  <div key={i} className="flex-1 min-w-[14px] flex flex-col items-center justify-end gap-px" style={{ height: 100 }}>
                    <div
                      className="w-full bg-[#00A99D]/80 rounded-sm min-h-0"
                      style={{ height: `${(b.entrada / maxVal) * 80}%` }}
                      title={`Comissão: ${formatAOA(b.entrada)}`}
                    />
                    <div
                      className="w-full bg-red-200 rounded-sm min-h-0"
                      style={{ height: `${(b.saida / maxVal) * 80}%` }}
                      title={`Levantamentos: ${formatAOA(b.saida)}`}
                    />
                  </div>
                ))}
              </div>
              {/* Labels — show subset to avoid clutter */}
              <div className="flex gap-px mt-1 overflow-hidden">
                {dados.grafico.map((b, i) => {
                  const total = dados.grafico.length;
                  const step = total <= 12 ? 1 : total <= 31 ? 5 : 2;
                  const show = i % step === 0 || i === total - 1;
                  return (
                    <div key={i} className="flex-1 min-w-[14px] text-center">
                      <span className={`text-[8px] text-gray-400 ${show ? "opacity-100" : "opacity-0"}`}>
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              Sem movimentos neste período.
            </div>
          )}
        </>
      )}
    </div>
  );
}
