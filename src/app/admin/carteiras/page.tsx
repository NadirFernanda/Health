"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, User, ChevronRight, AlertCircle, Search } from "lucide-react";

type ContaSummary = {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  saldo: number;
  saquesPendentes: number;
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(Math.round(v)) + " AOA";
}

export default function AdminContas() {
  const [lista, setLista] = useState<ContaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/carteiras", { credentials: "include" });
      if (r.ok) setLista(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtered = lista.filter((c) =>
    !filtro ||
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.email.toLowerCase().includes(filtro.toLowerCase()) ||
    c.especialidade.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalSaldo = lista.reduce((s, c) => s + c.saldo, 0);
  const totalPendentes = lista.reduce((s, c) => s + c.saquesPendentes, 0);

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Contas de Profissionais</h1>
        {totalPendentes > 0 && (
          <Link href="/admin/saques" className="flex items-center gap-1 text-xs font-semibold text-[#00A99D] bg-teal-50 px-2.5 py-1.5 rounded-full">
            <AlertCircle size={12} strokeWidth={2} />
            {totalPendentes} levantamento{totalPendentes !== 1 ? "s" : ""} pendente{totalPendentes !== 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Saldo total em contas</p>
          <p className="text-lg font-bold text-[#0B3C74] mt-0.5">{formatAOA(totalSaldo)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Profissionais registados</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">{lista.length}</p>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Pesquisar por nome, e-mail ou especialidade…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-[#0B3C74]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          <User size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
          {filtro ? `Nenhum resultado para "${filtro}".` : "Nenhum profissional registado."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/carteiras/${c.id}`}
              className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 hover:border-[#0B3C74]/20 transition-colors"
            >
              <div className="w-10 h-10 bg-[#0B3C74]/5 rounded-xl flex items-center justify-center shrink-0 font-bold text-[#0B3C74] text-base">
                {c.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                <p className="text-xs text-gray-400 truncate">{c.especialidade} · {c.email}</p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-sm font-bold text-[#0B3C74]">{formatAOA(c.saldo)}</p>
                  {c.saquesPendentes > 0 && (
                    <p className="text-[11px] text-[#00A99D] font-semibold">{c.saquesPendentes} pendente{c.saquesPendentes !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <ChevronRight size={15} strokeWidth={2} className="text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
