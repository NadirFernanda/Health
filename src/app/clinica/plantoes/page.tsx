import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { redirect } from "next/navigation";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function PlantoesDaClinica() {
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
  if (!clinica) redirect("/login");

  const plantoes = await prisma.plantao.findMany({
    where: { clinicaId: clinica.id },
    include: { _count: { select: { candidaturas: true } } },
    orderBy: { dataInicio: "desc" },
  });

  return (
    <div>
      <TopBar titulo="Os Meus Plantões" />
      <div className="px-4 pt-5 space-y-3">
        {plantoes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">Ainda não publicou nenhum plantão.</p>
            <Link href="/clinica/publicar" className="mt-4 inline-block bg-brand-500 text-white text-sm font-bold px-6 py-3 rounded-xl">
              Publicar Plantão
            </Link>
          </div>
        )}
        {plantoes.map((p) => (
          <Link href={`/clinica/plantoes/${p.id}`} key={p.id} className="block bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">{p.especialidade}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {p.dataInicio.toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })} ·{" "}
                  {p.dataInicio.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })} –{" "}
                  {p.dataFim.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                p.estado === "ABERTO" ? "bg-green-50 text-green-700" :
                p.estado === "FECHADO" ? "bg-gray-100 text-gray-600" :
                "bg-blue-50 text-blue-700"
              }`}>{p.estado}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[#1A6FBB] font-bold text-sm">{formatAOA(p.valorKwanzas)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-xs">{p._count.candidaturas} candidato(s)</span>
              <span className="ml-auto text-[#1A6FBB] text-xs font-semibold">Ver →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

