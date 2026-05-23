import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/nav";
import { Info, Printer, TrendingUp } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function FaturacaoClinica() {
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
  if (!clinica) redirect("/login");

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      candidaturaId: null,
      plantao: { clinicaId: clinica.id },
    },
    include: {
      plantao: { select: { especialidade: true, dataInicio: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  const totalBruto = pagamentos.reduce((s, p) => s + p.valorBrutoAoa, 0);
  const totalComissao = pagamentos.reduce((s, p) => s + p.comissaoAoa, 0);
  const confirmados = pagamentos.filter((p) => p.estado === "CONFIRMADO").length;

  return (
    <div>
      <TopBar titulo="Faturação" back="/clinica" />

      {/* Resumo */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] mx-4 mt-4 rounded-2xl px-5 py-5">
        <p className="text-blue-200 text-sm">Total pago em publicações</p>
        <p className="text-white text-4xl font-bold mt-1">{formatAOA(totalBruto)}</p>
        <p className="text-blue-200 text-xs mt-2">
          Comissão plataforma (10%): {formatAOA(totalComissao)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#0B3C74]">{pagamentos.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Plantões publicados</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-[#00A99D]">{confirmados}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pagamentos confirmados</p>
        </div>
      </div>

      {/* Info */}
      <div className="mx-4 mt-3 bg-[#0B3C74]/5 border border-[#0B3C74]/10 rounded-xl p-3 text-xs text-[#0B3C74] flex items-start gap-2">
        <Info size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
        A Medfreela cobra <strong>10% de comissão</strong> sobre cada publicação de plantão.
      </div>

      {/* Histórico */}
      <div className="px-4 pt-5 pb-28">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Histórico</h2>

        {pagamentos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <TrendingUp size={36} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Ainda sem pagamentos registados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pagamentos.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {p.plantao?.especialidade ?? "Plantão"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">
                        {p.plantao?.dataInicio
                          ? new Date(p.plantao.dataInicio).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })
                          : new Date(p.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        p.estado === "CONFIRMADO" ? "bg-green-100 text-green-700" : "bg-[#0B3C74]/10 text-[#0B3C74]/70"
                      }`}>
                        {p.estado === "CONFIRMADO" ? "Confirmado" : "Pendente"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">{formatAOA(p.valorBrutoAoa)}</p>
                      <p className="text-xs text-gray-400">comissão: {formatAOA(p.comissaoAoa)}</p>
                    </div>
                    <Link
                      href={`/recibo/${p.id}`}
                      className="p-2 rounded-xl bg-[#0B3C74]/5 hover:bg-[#0B3C74]/10 text-[#0B3C74] transition-colors"
                      title="Ver comprovativo"
                    >
                      <Printer size={14} strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
