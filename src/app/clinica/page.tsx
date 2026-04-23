import { clinicaLogada, plantoesDaClinica, formatAOA } from "@/lib/mock-data";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";

export default function ClinicaDashboard() {
  const totalPago = plantoesDaClinica.reduce((s, p) => s + p.valorKwanzas, 0);
  const plantoesConcluidos = plantoesDaClinica.length;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Painel da Clínica</p>
            <h1 className="text-white font-bold text-xl">{clinicaLogada.nome}</h1>
            <p className="text-blue-200 text-xs mt-0.5">📍 {clinicaLogada.cidade}</p>
          </div>
          <Link href="/clinica/conta" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">👤</Link>
        </div>
        {clinicaLogada.verified && (
          <span className="inline-flex items-center gap-1 bg-[#27AE60]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            ✓ Clínica Verificada
          </span>
        )}

        {/* Resumo mês */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Plantões este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{plantoesConcluidos}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Total pago</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatAOA(totalPago)}</p>
          </div>
        </div>
      </div>

      {/* Publicar novo */}
      <div className="px-4 pt-5">
        <Link
          href="/clinica/publicar"
          className="flex items-center justify-center gap-2 bg-[#27AE60] hover:bg-[#1A7A42] text-white font-bold py-4 rounded-2xl transition-colors w-full"
        >
          <span className="text-xl">+</span> PUBLICAR NOVO PLANTÃO
        </Link>
      </div>

      {/* Plantões ativos */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões Ativos</h2>
          <Link href="/clinica/plantoes" className="text-xs text-[#1A6FBB] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoesDaClinica.map((p) => (
            <PlantaoCard
              key={p.id}
              plantao={p}
              basePath="/clinica/plantoes"
              showCandidatarBtn={false}
              showCandidatos
            />
          ))}
        </div>
      </div>
    </div>
  );
}
