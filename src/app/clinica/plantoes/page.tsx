import { plantoesDaClinica, candidatosMock, formatAOA } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";

export default function PlantoesDaClinica() {
  return (
    <div>
      <TopBar titulo="Os Meus Plantões" />
      <div className="px-4 pt-5 space-y-3">
        {plantoesDaClinica.map((p) => (
          <Link href={`/clinica/plantoes/${p.id}`} key={p.id} className="block bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">{p.especialidade}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(p.dataInicio).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })} ·{" "}
                  {new Date(p.dataInicio).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })} –{" "}
                  {new Date(p.dataFim).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">Aberto</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[#1A6FBB] font-bold text-sm">{formatAOA(p.valorKwanzas)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-xs">{candidatosMock.length} candidato(s)</span>
              <span className="ml-auto text-[#1A6FBB] text-xs font-semibold">Ver →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
