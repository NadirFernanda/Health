import { allTransacoesMock, adminStats, formatAOA } from "@/lib/mock-data";
import { TrendingUp, ArrowUp } from "lucide-react";

export default function AdminTransacoes() {
  const totalCredito = allTransacoesMock
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PROCESSADO")
    .reduce((s, t) => s + Number(t.valorCentavos / 100n), 0);
  const totalDebito = allTransacoesMock
    .filter((t) => t.tipo === "DEBITO")
    .reduce((s, t) => s + Number(t.valorCentavos / 100n), 0);
  const pendente = allTransacoesMock
    .filter((t) => t.estado === "PENDENTE")
    .reduce((s, t) => s + Number(t.valorCentavos / 100n), 0);
  const comissaoEstimada = Math.round(totalCredito * 0.1);

  return (
    <div className="p-4 space-y-5 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <h1 className="text-base font-bold text-gray-900">Finanças & Transações</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Receita total</p>
          <p className="text-lg font-bold text-gray-900">{formatAOA(adminStats.receitaPlataforma)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Todos os tempos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Comissão Planto (10%)</p>
          <p className="text-lg font-bold text-purple-600">{formatAOA(adminStats.comissaoPlataforma)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Todos os tempos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pagamentos a médicos</p>
          <p className="text-lg font-bold text-[#00A99D]">{formatAOA(totalCredito)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Histórico visível</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Em processamento</p>
          <p className="text-lg font-bold text-yellow-600">{formatAOA(pendente)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Aguarda liquidação</p>
        </div>
      </div>

      {/* Info comissão */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-purple-800 mb-2">Modelo de Receita</p>
        <div className="space-y-1.5 text-xs text-purple-700">
          <div className="flex justify-between">
            <span>Comissão estimada (histórico visível)</span>
            <span className="font-bold">{formatAOA(comissaoEstimada)}</span>
          </div>
          <div className="flex justify-between">
            <span>Levantamentos processados</span>
            <span className="font-bold text-gray-600">− {formatAOA(totalDebito)}</span>
          </div>
          <div className="flex justify-between border-t border-purple-200 pt-1.5 mt-1.5">
            <span className="font-semibold">Taxa de comissão</span>
            <span className="font-bold">10% por plantão</span>
          </div>
        </div>
      </div>

      {/* Lista de transações */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Todas as Transações ({allTransacoesMock.length})
        </p>
        <div className="space-y-2">
          {allTransacoesMock
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  t.tipo === "CREDITO" ? "bg-green-50" : "bg-gray-100"
                }`}>
                  {t.tipo === "CREDITO"
                    ? <TrendingUp size={18} strokeWidth={1.75} className="text-green-600" />
                    : <ArrowUp size={18} strokeWidth={1.75} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">
                      {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    {t.estado === "PENDENTE" && (
                      <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-1.5 py-0.5 rounded-full">Pendente</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${t.tipo === "CREDITO" ? "text-[#00A99D]" : "text-gray-600"}`}>
                    {t.tipo === "CREDITO" ? "+" : "−"}{formatAOA(Number(t.valorCentavos / 100n))}
                  </p>
                  {t.tipo === "CREDITO" && (
                    <p className="text-xs text-purple-500 mt-0.5">comissão: {formatAOA(Math.round(Number(t.valorCentavos / 100n) * 0.1))}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
