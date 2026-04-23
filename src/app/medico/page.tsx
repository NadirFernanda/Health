import { medicoLogado, plantoesMock, candidaturasMock, transacoesMock, formatAOA } from "@/lib/mock-data";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";

export default function MedicoDashboard() {
  const ganhosMes = transacoesMock
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PROCESSADO")
    .reduce((sum, t) => sum + t.valor, 0);
  const plantoesMes = candidaturasMock.filter((c) => c.estado === "ACEITE").length;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Olá 👋</p>
            <h1 className="text-white font-bold text-xl">{medicoLogado.nome}</h1>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">🔔</button>
            <Link href="/medico/perfil" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">👤</Link>
          </div>
        </div>
        {medicoLogado.verified && (
          <span className="inline-flex items-center gap-1 bg-[#27AE60]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            ✓ Perfil Verificado
          </span>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Plantões este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{plantoesMes}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Ganhos este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatAOA(ganhosMes)}</p>
          </div>
        </div>
      </div>

      {/* Candidaturas recentes */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">As minhas candidaturas</h2>
          <Link href="/medico/buscar" className="text-xs text-[#1A6FBB] font-semibold">Ver todas</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {candidaturasMock.map((c) => {
            const cor = c.estado === "ACEITE" ? "bg-green-50 text-green-700 border-green-200"
              : c.estado === "RECUSADO" ? "bg-red-50 text-red-600 border-red-200"
              : "bg-yellow-50 text-yellow-700 border-yellow-200";
            return (
              <div key={c.id} className={`shrink-0 border rounded-xl px-3 py-2 text-xs font-semibold ${cor}`}>
                {c.estado === "ACEITE" ? "✓" : c.estado === "RECUSADO" ? "✗" : "⏳"} {c.plantao.clinica.nome}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plantões disponíveis */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões para si</h2>
          <Link href="/medico/buscar" className="text-xs text-[#1A6FBB] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoesMock.filter(p => p.estado === "ABERTO").map((p) => (
            <PlantaoCard key={p.id} plantao={p} showCandidatarBtn />
          ))}
        </div>
      </div>
    </div>
  );
}
