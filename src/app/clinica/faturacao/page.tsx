import { clinicaLogada, plantoesDaClinica, formatAOA } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";

const transacoes = [
  { id: "tf-001", descricao: "Plantão — Dr. João Silva", data: "2026-04-22", valor: 15000, comissao: 1500 },
  { id: "tf-002", descricao: "Plantão noturno — Dra. Ana Ferreira", data: "2026-04-18", valor: 20000, comissao: 2000 },
  { id: "tf-003", descricao: "Plantão — Dr. Manuel Costa", data: "2026-04-10", valor: 15000, comissao: 1500 },
];

export default function FaturacaoClinica() {
  const totalPago = transacoes.reduce((s, t) => s + t.valor, 0);
  const totalComissao = transacoes.reduce((s, t) => s + t.comissao, 0);

  return (
    <div>
      <TopBar titulo="Faturação" />

      {/* Resumo */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] mx-4 mt-4 rounded-2xl px-5 py-5">
        <p className="text-blue-200 text-sm">Total pago este mês</p>
        <p className="text-white text-4xl font-bold mt-1">{formatAOA(totalPago)}</p>
        <p className="text-blue-200 text-xs mt-2">
          Comissão plataforma (10%): {formatAOA(totalComissao)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#1A6FBB]">{transacoes.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Plantões pagos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#27AE60]">{formatAOA(totalPago - totalComissao)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pago aos médicos</p>
        </div>
      </div>

      {/* Info comissão */}
      <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        💡 A Planto cobra <strong>10% de comissão</strong> sobre cada plantão. O valor é debitado automaticamente no momento da confirmação.
      </div>

      {/* Histórico */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Histórico</h2>
        <div className="space-y-2">
          {transacoes.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.descricao}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">{formatAOA(t.valor)}</p>
                  <p className="text-xs text-gray-400">comissão: {formatAOA(t.comissao)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
