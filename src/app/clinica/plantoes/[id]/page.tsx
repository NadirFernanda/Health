import { candidatosMock, plantoesDaClinica, formatAOA, formatData, formatHora } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DetalhePlantaoClinica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plantao = plantoesDaClinica.find((p) => p.id === id);
  if (!plantao) return notFound();

  return (
    <div>
      <TopBar titulo="Candidatos" back="/clinica" />

      {/* Info do plantão */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900">{plantao.especialidade}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          📅 {formatData(plantao.dataInicio)} · {formatHora(plantao.dataInicio)} – {formatHora(plantao.dataFim)}
        </p>
        <p className="text-[#1A6FBB] font-bold mt-1">{formatAOA(plantao.valorKwanzas)}</p>
        <span className="inline-block mt-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {candidatosMock.length} candidato(s)
        </span>
      </div>

      {/* Lista de candidatos */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Candidatos Disponíveis</h2>
        <div className="space-y-3">
          {candidatosMock.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl font-bold text-[#1A6FBB] shrink-0">
                  {m.nome.split(" ")[1]?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{m.nome}</p>
                    {m.verified && <span className="text-[#27AE60] text-xs font-bold shrink-0">✓</span>}
                  </div>
                  <p className="text-xs text-gray-500">{m.especialidade}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-yellow-500 text-xs">⭐ {m.rating}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-400 text-xs">{m.totalPlantoes} plantões</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-xs">
                  RECUSAR
                </button>
                <Link
                  href={`/clinica`}
                  className="flex-1 text-center bg-[#27AE60] text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  ACEITAR
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
