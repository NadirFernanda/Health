import { getAuthSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Calendar, BadgeCheck, Star, MessageCircle, Users, CheckCircle2 } from "lucide-react";
import CandidaturaActions from "./CandidaturaActions";
import { DisputaClinicaButton } from "./DisputaClinicaButton";
import LiberarPagamentoButton from "./LiberarPagamentoButton";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-PT").format(v) + " AOA";
}

export default async function DetalhePlantaoClinica({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await getClinicaFromSession(session);
  if (!clinica) redirect("/login");

  const plantao = await prisma.plantao.findFirst({
    where: { id, clinicaId: clinica.id },
    include: {
      _count: { select: { candidaturas: true } },
    },
  });
  if (!plantao) return notFound();

  const candidaturas = await prisma.candidatura.findMany({
    where: { plantaoId: id },
    include: {
      profissional: true,
    },
    orderBy: { criadoEm: "desc" },
  });

  // Find all confirmed escrow payments for this plantão (by plantaoId, not candidaturaId)
  // so we show the button even when the candidaturaId link was missed at signing time.
  const escrows = await prisma.pagamento.findMany({
    where: { plantaoId: id, tipo: "TURNO" },
    select: { id: true, candidaturaId: true, beneficiarioProfissionalId: true, valorLiquidoAoa: true, liberadoEm: true },
  });

  function escrowParaCandidatura(candId: string, profId: string) {
    return escrows.find((e) => e.candidaturaId === candId || e.beneficiarioProfissionalId === profId) ?? null;
  }

  // Contar mensagens não lidas por candidatura (defensive — Mensagem table may not exist yet)
  let naoLidasMap: Record<string, number> = {};
  try {
    const naoLidasPorCandidatura = await prisma.mensagem.groupBy({
      by: ["candidaturaId"],
      where: {
        candidaturaId: { in: candidaturas.map((c) => c.id) },
        lida: false,
        autorUserId: { not: session.id },
      },
      _count: { id: true },
    });
    naoLidasMap = Object.fromEntries(
      naoLidasPorCandidatura.map((r) => [r.candidaturaId, r._count.id])
    );
  } catch { /* Mensagem table may not exist yet in production */ }

  const estadoMap: Record<string, { label: string; cls: string }> = {
    ABERTO:       { label: "Aberto",       cls: "bg-green-50 text-green-700" },
    FECHADO:      { label: "Fechado",      cls: "bg-gray-100 text-gray-600" },
    EM_ANDAMENTO: { label: "Em andamento", cls: "bg-yellow-50 text-yellow-700" },
    CONCLUIDO:    { label: "Concluído",    cls: "bg-blue-50 text-blue-700" },
    CANCELADO:    { label: "Cancelado",    cls: "bg-red-50 text-red-600" },
  };
  const estadoCand: Record<string, { label: string; cls: string }> = {
    PENDENTE:              { label: "Pendente",           cls: "bg-yellow-50 text-yellow-700" },
    CONTRATO_PENDENTE:     { label: "Contrato enviado",   cls: "bg-blue-50 text-blue-700" },
    AGUARDANDO_PAGAMENTO:  { label: "Ag. pagamento",      cls: "bg-teal-50 text-teal-700" },
    ACEITE:                { label: "Aceite",             cls: "bg-green-50 text-green-700" },
    CONCLUIDO:             { label: "Concluído",          cls: "bg-teal-50 text-teal-700" },
    RECUSADO:              { label: "Recusado",           cls: "bg-red-50 text-red-600" },
    CANCELADA:             { label: "Cancelada",          cls: "bg-gray-100 text-gray-500" },
  };

  const estado = estadoMap[plantao.estado] ?? { label: plantao.estado, cls: "bg-gray-100 text-gray-600" };

  return (
    <div className="pb-28">
      <TopBar titulo="Candidatos" back="/clinica/plantoes" />

      {/* Resumo do plantão */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-base">{plantao.especialidade}</p>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <Calendar size={13} strokeWidth={1.75} className="inline" />
              {plantao.dataInicio.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
              {" · "}
              {plantao.dataInicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {plantao.dataFim.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[#0B3C74] font-bold text-sm mt-1">{formatAOA(plantao.valorKwanzas)}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${estado.cls}`}>
            {estado.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Users size={13} strokeWidth={1.75} />
            {plantao.vagasPreenchidas}/{plantao.vagas} vagas preenchidas
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle2 size={13} strokeWidth={1.75} />
            {candidaturas.length} candidato(s)
          </span>
        </div>
      </div>

      {/* Lista de candidatos */}
      <div className="px-4 pt-4 space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Candidaturas</h2>

        {candidaturas.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
            <p className="text-sm">Nenhuma candidatura ainda.</p>
            <p className="text-xs text-gray-300 mt-1">Partilha o plantão para receber mais candidatos.</p>
          </div>
        )}

        {candidaturas.map((c) => {
          const est = estadoCand[c.estado] ?? { label: c.estado, cls: "bg-gray-100 text-gray-500" };
          const naoLidas = naoLidasMap[c.id] ?? 0;
          const iniciais = c.profissional.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              {/* Cabeçalho candidato */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-lg font-bold text-[#0B3C74] shrink-0">
                  {iniciais}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm truncate">{c.profissional.nome}</p>
                    {c.profissional.verified && (
                      <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D] shrink-0" />
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${est.cls}`}>
                      {est.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.profissional.especialidade}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500 text-xs inline-flex items-center gap-0.5">
                      <Star size={11} strokeWidth={1.75} fill="currentColor" />
                      {c.profissional.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-300 text-xs">·</span>
                    <span className="text-gray-400 text-xs">{c.profissional.totalPlantoes} plantões</span>
                    {c.profissional.anosExperiencia && (
                      <>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{c.profissional.anosExperiencia}a exp.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensagem inicial */}
              {c.mensagem && (
                <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">
                  &ldquo;{c.mensagem}&rdquo;
                </p>
              )}

              {/* Acções */}
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/clinica/medicos/${c.profissional.id}`}
                  className="flex items-center justify-center gap-1 border border-[#0B3C74]/20 text-[#0B3C74] font-semibold py-2.5 px-3 rounded-xl text-xs"
                >
                  Ver Perfil
                </Link>
                <Link
                  href={`/clinica/plantoes/${id}/mensagens/${c.id}`}
                  className="relative flex items-center justify-center gap-1.5 flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs"
                >
                  <MessageCircle size={14} strokeWidth={2} />
                  Mensagens
                  {naoLidas > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {naoLidas}
                    </span>
                  )}
                </Link>
                {c.estado === "PENDENTE" && (
                  <CandidaturaActions
                    candidaturaId={c.id}
                    plantaoId={id}
                    nomeMedico={c.profissional.nome}
                  />
                )}
                {c.estado === "CONTRATO_PENDENTE" && (
                  <span className="flex-1 flex items-center justify-center text-xs text-blue-600 font-semibold bg-blue-50 rounded-xl py-2.5 gap-1">
                    ⏳ A aguardar assinatura
                  </span>
                )}
                {c.estado === "ACEITE" && (
                  <div className="flex-1">
                    <DisputaClinicaButton candidaturaId={c.id} />
                  </div>
                )}
              </div>
              {c.estado === "CONCLUIDO" && (() => {
                const escrow = escrowParaCandidatura(c.id, c.profissional.id);
                const jaLiberado = !!escrow?.liberadoEm;
                const valorLiquido = escrow?.valorLiquidoAoa ?? Math.round(plantao.valorKwanzas * 0.90);
                return (
                  <div className="mt-2">
                    {jaLiberado ? (
                      <span className="w-full flex items-center justify-center text-xs text-teal-600 font-semibold bg-teal-50 rounded-xl py-2.5">
                        Pagamento já liberado
                      </span>
                    ) : (
                      <LiberarPagamentoButton
                        candidaturaId={c.id}
                        plantaoId={id}
                        nomeMedico={c.profissional.nome}
                        valorLiquidoAoa={valorLiquido}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
