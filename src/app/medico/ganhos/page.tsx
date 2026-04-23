import { medicoLogado, transacoesMock, formatAOA } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";

export default function GanhosMedico() {
  const pendente = transacoesMock
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PENDENTE")
    .reduce((sum, t) => sum + t.valor, 0);

  return (
    <div>
      <TopBar titulo="Meus Ganhos" />

      {/* Saldo */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 py-6 mx-4 mt-4 rounded-2xl">
        <p className="text-blue-200 text-sm">Saldo disponível</p>
        <p className="text-white text-4xl font-bold mt-1">{formatAOA(medicoLogado.saldoCarteira)}</p>
        {pendente > 0 && (
          <p className="text-blue-200 text-xs mt-2">
            🕐 {formatAOA(pendente)} em processamento (liberação em 24h)
          </p>
        )}
        <button className="mt-4 bg-white text-[#1A6FBB] font-bold text-sm px-5 py-2.5 rounded-xl w-full">
          LEVANTAR SALDO
        </button>
      </div>

      {/* Histórico */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Histórico</h2>
        <div className="space-y-2">
          {transacoesMock.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                t.tipo === "CREDITO" ? "bg-green-50" : "bg-gray-100"
              }`}>
                {t.tipo === "CREDITO" ? "💚" : "↑"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.descricao}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${t.tipo === "CREDITO" ? "text-[#27AE60]" : "text-gray-600"}`}>
                  {t.tipo === "CREDITO" ? "+" : "-"}{formatAOA(t.valor)}
                </p>
                {t.estado === "PENDENTE" && (
                  <span className="text-xs text-yellow-600 font-medium">Pendente</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
