"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Search } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(v);
}

type Transacao = {
  id: string; descricao: string; valorBruto: number; comissao: number;
  valorLiquido: number; estado: string; data: string; beneficiario: string | null;
};

export default function AdminTransacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "CONFIRMADO" | "PENDENTE">("TODOS");

  useEffect(() => {
    fetch("/api/admin/transacoes", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTransacoes(d); })
      .finally(() => setLoading(false));
  }, []);

  // Summary always over full dataset
  const totalCredito  = transacoes.filter((t) => t.estado === "CONFIRMADO").reduce((s, t) => s + t.valorBruto, 0);
  const totalComissao = transacoes.filter((t) => t.estado === "CONFIRMADO").reduce((s, t) => s + t.comissao, 0);
  const pendente      = transacoes.filter((t) => t.estado === "PENDENTE").reduce((s, t) => s + t.valorBruto, 0);

  const q = pesquisa.toLowerCase();
  const filtered = transacoes.filter((t) => {
    const matchEstado  = filtroEstado === "TODOS" || t.estado === filtroEstado;
    const matchSearch  = !q ||
      t.descricao.toLowerCase().includes(q) ||
      (t.beneficiario ?? "").toLowerCase().includes(q);
    return matchEstado && matchSearch;
  });

  if (loading) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 space-y-5 pb-10 max-w-2xl mx-auto">
      <h1 className="text-base font-bold text-gray-900">Finanças & Transações</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Receita total</p>
          <p className="text-lg font-bold text-gray-900">{formatAOA(totalCredito)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Transações confirmadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Comissão Medfreela (10%)</p>
          <p className="text-lg font-bold text-[#0B3C74]">{formatAOA(totalComissao)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Todos os tempos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pago a profissionais</p>
          <p className="text-lg font-bold text-[#00A99D]">{formatAOA(totalCredito - totalComissao)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Valor líquido</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Em processamento</p>
          <p className="text-lg font-bold text-[#0B3C74]/70">{formatAOA(pendente)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Aguarda liquidação</p>
        </div>
      </div>

      {/* Info comissão */}
      <div className="bg-[#0B3C74]/5 border border-[#0B3C74]/10 rounded-2xl p-4">
        <p className="text-sm font-bold text-[#0B3C74] mb-2">Modelo de Receita</p>
        <div className="space-y-1.5 text-xs text-[#0B3C74]">
          <div className="flex justify-between">
            <span>Total confirmado</span>
            <span className="font-bold">{formatAOA(totalCredito)}</span>
          </div>
          <div className="flex justify-between">
            <span>Comissão acumulada</span>
            <span className="font-bold">{formatAOA(totalComissao)}</span>
          </div>
          <div className="flex justify-between border-t border-[#0B3C74]/20 pt-1.5 mt-1.5">
            <span className="font-semibold">Taxa de comissão</span>
            <span className="font-bold">10% por plantão</span>
          </div>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="space-y-3">
        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["TODOS", "CONFIRMADO", "PENDENTE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtroEstado === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "TODOS" ? "Todas" : f === "CONFIRMADO" ? "Confirmadas" : "Pendentes"}
            </button>
          ))}
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Pesquisar por descrição ou beneficiário…"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
          />
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            {pesquisa ? `Nenhum resultado para "${pesquisa}".` : "Nenhuma transação registada."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-green-50">
                  <TrendingUp size={18} strokeWidth={1.75} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">
                      {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    {t.estado === "PENDENTE" && (
                      <span className="text-xs text-[#0B3C74] font-medium bg-[#0B3C74]/10 px-1.5 py-0.5 rounded-full">Pendente</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-[#00A99D]">+{formatAOA(t.valorBruto)}</p>
                  <p className="text-xs text-[#0B3C74]/80 mt-0.5">comissão: {formatAOA(t.comissao)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
