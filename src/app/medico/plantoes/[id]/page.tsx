import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, Star, Stethoscope, Calendar, Clock, Banknote, Users,
  CheckCircle, XCircle, BadgeCheck, AlertTriangle, MessageCircle,
  CheckCircle2, XCircle as XCircleIcon, FileText, Activity, Trophy,
  Lock, Building2, UserCircle2, Syringe,
} from "lucide-react";
import { DisputaButton } from "./DisputaButton";
import MedicoCandidaturaActions from "./MedicoCandidaturaActions";
import TerminarPlantaoButton from "./TerminarPlantaoButton";
import LiberarPagamentoButton from "@/app/clinica/plantoes/[id]/LiberarPagamentoButton";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatData(d: Date) {
  return d.toLocaleDateString("pt-AO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function formatHora(d: Date) { return d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }); }
function calcularDuracao(inicio: Date, fim: Date) {
  const h = Math.round((fim.getTime() - inicio.getTime()) / 3600000);
  return `${h}h`;
}

const EQUIP_LABELS: { key: string; label: string }[] = [
  { key: "maca",           label: "Maca de exame" },
  { key: "estetoscopio",   label: "Estetoscópio" },
  { key: "tensiometro",    label: "Tensiômetro" },
  { key: "termometro",     label: "Termómetro" },
  { key: "computador",     label: "Computador" },
  { key: "materiaisBasicos", label: "Materiais básicos" },
  { key: "nebulizador",    label: "Nebulizador" },
  { key: "oximetro",       label: "Oxímetro" },
  { key: "glucometro",     label: "Glucómetro" },
  { key: "desfibrilador",  label: "Desfibrilador" },
];

export default async function DetalhePlantao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plantao = await prisma.plantao.findUnique({
    where: { id },
    include: { clinica: true, profissionalPublicador: true },
  });
  if (!plantao) return notFound();

  const session = await getAuthSession();
  const prof = session?.role === "MEDICO" ? await getProfissionalFromSession(session) : null;

  /* ─── PUBLISHER VIEW ─── */
  if (prof && plantao.profissionalPublicadorId === prof.id) {
    const candidaturas = await prisma.candidatura.findMany({
      where: { plantaoId: id },
      include: { profissional: true },
      orderBy: { criadoEm: "desc" },
    });

    let naoLidasMap: Record<string, number> = {};
    try {
      const grouped = await prisma.mensagem.groupBy({
        by: ["candidaturaId"],
        where: { candidaturaId: { in: candidaturas.map((c) => c.id) }, lida: false, autorUserId: { not: session!.id } },
        _count: { id: true },
      });
      naoLidasMap = Object.fromEntries(grouped.map((r) => [r.candidaturaId, r._count.id]));
    } catch { /* ok */ }

    const escrowsMedico = await prisma.pagamento.findMany({
      where: { plantaoId: id, tipo: "TURNO" },
      select: { id: true, candidaturaId: true, beneficiarioProfissionalId: true, valorLiquidoAoa: true, liberadoEm: true },
    });
    function escrowParaCandidaturaMedico(candId: string, profId: string) {
      return escrowsMedico.find((e) => e.candidaturaId === candId || e.beneficiarioProfissionalId === profId) ?? null;
    }

    const estadoCand: Record<string, { label: string; cls: string }> = {
      PENDENTE:             { label: "Pendente",          cls: "bg-teal-50 text-teal-700" },
      CONTRATO_PENDENTE:    { label: "Contrato enviado",  cls: "bg-blue-50 text-blue-700" },
      AGUARDANDO_PAGAMENTO: { label: "Ag. pagamento",     cls: "bg-teal-50 text-teal-700" },
      ACEITE:               { label: "Aceite",            cls: "bg-emerald-50 text-emerald-700" },
      CONCLUIDO:            { label: "Concluído",         cls: "bg-teal-50 text-teal-700" },
      RECUSADO:             { label: "Recusado",          cls: "bg-red-50 text-red-600" },
      CANCELADA:            { label: "Cancelada",         cls: "bg-gray-100 text-gray-500" },
    };

    return (
      <div className="pb-28">
        <TopBar titulo="Candidatos" back="/medico/plantoes" />

        {/* Hero summary */}
        <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-8">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
              <Syringe size={22} strokeWidth={1.75} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-lg leading-tight">{plantao.especialidade}</h1>
              <p className="text-blue-200 text-xs mt-0.5">
                {plantao.dataInicio.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}
                {formatHora(plantao.dataInicio)} – {formatHora(plantao.dataFim)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Banknote size={13} strokeWidth={1.75} className="text-teal-200" />
              <span className="text-white font-bold text-sm">{formatAOA(plantao.valorKwanzas)}</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Users size={12} strokeWidth={1.75} className="text-teal-200" />
              <span className="text-white text-xs font-semibold">
                {plantao.vagasPreenchidas}/{plantao.vagas} vagas
              </span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <CheckCircle2 size={12} strokeWidth={1.75} className="text-teal-200" />
              <span className="text-white text-xs font-semibold">{candidaturas.length} candidato{candidaturas.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Candidaturas */}
        <div className="px-4 -mt-3 space-y-3">
          {candidaturas.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-14">
              <Users size={36} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
              <p className="text-sm font-medium text-gray-500">Nenhuma candidatura ainda.</p>
              <p className="text-xs text-gray-400 mt-1">Partilha o teu plantão para receber candidatos.</p>
            </div>
          )}

          {candidaturas.map((c) => {
            const est = estadoCand[c.estado] ?? { label: c.estado, cls: "bg-gray-100 text-gray-500" };
            const naoLidas = naoLidasMap[c.id] ?? 0;
            const iniciais = c.profissional.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0B3C74]/8 flex items-center justify-center text-base font-black text-[#0B3C74] shrink-0">
                      {iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{c.profissional.nome}</p>
                        {c.profissional.verified && (
                          <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D] shrink-0" />
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${est.cls}`}>
                          {est.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.profissional.especialidade}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-teal-500 text-xs inline-flex items-center gap-0.5">
                          <Star size={10} strokeWidth={1.75} fill="currentColor" />
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

                  {c.mensagem && (
                    <p className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 italic leading-5">
                      &ldquo;{c.mensagem}&rdquo;
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/medico/medicos/${c.profissional.id}`}
                      className="flex items-center justify-center gap-1 border border-[#0B3C74]/20 text-[#0B3C74] font-semibold py-2.5 px-3 rounded-xl text-xs shrink-0"
                    >
                      Ver Perfil
                    </Link>
                    <Link
                      href={`/medico/plantoes/${id}/mensagens`}
                      className="relative flex items-center justify-center gap-1.5 flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs"
                    >
                      <MessageCircle size={13} strokeWidth={2} />
                      Mensagens
                      {naoLidas > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {naoLidas}
                        </span>
                      )}
                    </Link>
                    {c.estado === "PENDENTE" && (
                      <MedicoCandidaturaActions
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
                  </div>

                  {c.estado === "CONCLUIDO" && (() => {
                    const escrow = escrowParaCandidaturaMedico(c.id, c.profissional.id);
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
                            apiPath={`/api/medico/publicar/${id}/liberar-pagamento`}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─── CANDIDATE VIEW ─── */
  let candidatura: { id: string; estado: string; naoLidas: number } | null = null;
  if (prof) {
    try {
      const cand = await prisma.candidatura.findUnique({
        where: { plantaoId_profissionalId: { plantaoId: id, profissionalId: prof.id } },
      });
      if (cand) {
        let naoLidas = 0;
        try {
          const msgs = await prisma.mensagem.findMany({
            where: { candidaturaId: cand.id, lida: false },
          });
          naoLidas = msgs.filter((m) => m.autorUserId !== session?.id).length;
        } catch { /* ok */ }
        candidatura = { id: cand.id, estado: cand.estado, naoLidas };
      }
    } catch { /* ok */ }
  }

  const { clinica, profissionalPublicador, especialidade, dataInicio, dataFim, valorKwanzas, vagas, vagasPreenchidas, descricao } = plantao;
  const publisherName = clinica ? clinica.nome : (profissionalPublicador?.nome ?? "Médico");
  const publisherInitial = publisherName.charAt(0).toUpperCase();
  const publisherVerified = clinica?.verified || profissionalPublicador?.verified;
  const duracao = calcularDuracao(dataInicio, dataFim);
  const vagasRestantes = vagas - vagasPreenchidas;

  const equipDisponiveis = EQUIP_LABELS.filter(({ key }) => plantao[key as keyof typeof plantao] === true);
  const equipIndisponiveis = EQUIP_LABELS.filter(({ key }) => plantao[key as keyof typeof plantao] !== true);

  return (
    <div className="pb-8">
      <TopBar titulo="Detalhe do Plantão" back={clinica ? "/medico/buscar" : "/medico/plantoes"} />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-10">
        {/* Publisher avatar */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
            {publisherInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-bold text-base leading-tight truncate">{publisherName}</h2>
              {publisherVerified && (
                <BadgeCheck size={15} strokeWidth={2} className="text-teal-200 shrink-0" />
              )}
            </div>
            {clinica ? (
              <>
                <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin size={10} strokeWidth={1.75} />
                  {clinica.cidade}, {clinica.provincia}
                </p>
                <p className="flex items-center gap-1 text-teal-300 text-xs mt-0.5">
                  <Star size={10} strokeWidth={1.75} fill="currentColor" />
                  {clinica.rating.toFixed(1)} · {clinica.totalAvaliacoes} avaliações
                </p>
              </>
            ) : (
              <>
                <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1.5">
                  <UserCircle2 size={11} strokeWidth={1.75} /> Plantão publicado por médico
                </p>
                {profissionalPublicador?.especialidade && (
                  <p className="text-teal-200 text-xs mt-0.5">{profissionalPublicador.especialidade}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Specialty + tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 text-white text-xs font-bold flex items-center gap-1.5">
            <Stethoscope size={12} strokeWidth={2} /> {especialidade}
          </span>
          {!clinica && (
            <span className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-teal-100 text-xs font-semibold flex items-center gap-1.5">
              <UserCircle2 size={11} strokeWidth={1.75} /> Substituição
            </span>
          )}
          {clinica && (
            <span className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-teal-100 text-xs font-semibold flex items-center gap-1.5">
              <Building2 size={11} strokeWidth={1.75} /> Clínica
            </span>
          )}
        </div>
      </div>

      {/* ── Price card ── */}
      <div className="mx-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Remuneração</p>
            <p className="text-[#00A99D] font-black text-2xl">{formatAOA(valorKwanzas)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-medium mb-0.5">Vagas restantes</p>
            <p className="text-gray-900 font-black text-2xl">{vagasRestantes}<span className="text-gray-400 text-sm font-normal">/{vagas}</span></p>
          </div>
        </div>
      </div>

      {/* ── Status banners ── */}
      {plantao.estado === "EM_ANDAMENTO" && (
        <div className="mx-4 mt-3 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Activity size={16} strokeWidth={2} className="text-[#00A99D]" />
          </div>
          <div>
            <p className="text-sm font-bold text-teal-700">Plantão em andamento</p>
            <p className="text-xs text-[#00A99D]">A decorrer agora · termina às {formatHora(dataFim)}</p>
          </div>
        </div>
      )}
      {plantao.estado === "CONCLUIDO" && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Trophy size={16} strokeWidth={2} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">Plantão concluído</p>
            <p className="text-xs text-emerald-600">Pagamento creditado na carteira</p>
          </div>
        </div>
      )}
      {(plantao.estado as string) === "CANCELADO" && (
        <div className="mx-4 mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <XCircle size={16} strokeWidth={2} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Este plantão foi cancelado</p>
        </div>
      )}
      {plantao.estado === "FECHADO" && !candidatura && (
        <div className="mx-4 mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Lock size={16} strokeWidth={2} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Todas as vagas preenchidas</p>
        </div>
      )}

      {/* ── Schedule card ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-3.5">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Horário</h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
            <Calendar size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Data</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{formatData(dataInicio)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Clock size={14} strokeWidth={1.75} className="text-[#00A99D]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Horário</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatHora(dataInicio)} – {formatHora(dataFim)}
              <span className="ml-1.5 text-xs font-normal text-gray-400">({duracao})</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Equipment ── */}
      {(equipDisponiveis.length > 0 || equipIndisponiveis.length > 0) && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Equipamentos</h3>
          {equipDisponiveis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {equipDisponiveis.map(({ label }) => (
                <span key={label} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle size={11} strokeWidth={2.5} /> {label}
                </span>
              ))}
            </div>
          )}
          {equipIndisponiveis.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {equipIndisponiveis.map(({ label }) => (
                <span key={label} className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 text-xs px-2.5 py-1 rounded-full line-through">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Description ── */}
      {descricao && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</h3>
          <p className="text-sm text-gray-700 leading-6">{descricao}</p>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="px-4 pt-4 pb-4">
        <div className="space-y-2.5">

          {/* No candidatura + open */}
          {!candidatura && plantao.estado === "ABERTO" && (
            <>
              <Link
                href={`/medico/plantoes/${plantao.id}/confirmar`}
                className="block w-full text-center bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-black py-4 rounded-2xl text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                CANDIDATAR-ME
              </Link>
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <AlertTriangle size={11} strokeWidth={2} className="text-teal-400" />
                Só médicos com perfil verificado podem candidatar-se
              </p>
            </>
          )}

          {/* Contrato pendente */}
          {candidatura?.estado === "CONTRATO_PENDENTE" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={15} strokeWidth={2} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">Contrato para assinar</p>
                  <p className="text-xs text-blue-500 mt-0.5 leading-4">A clínica aceitou a tua candidatura. Revê e assina o contrato.</p>
                </div>
              </div>
              <Link
                href={`/medico/plantoes/${plantao.id}/contrato`}
                className="block w-full text-center bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-black py-4 rounded-2xl text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                VER E ASSINAR CONTRATO
              </Link>
              <Link
                href={`/medico/plantoes/${plantao.id}/mensagens`}
                className="relative flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 font-semibold py-3 rounded-2xl text-sm"
              >
                <MessageCircle size={15} strokeWidth={2} />
                Mensagens
                {(candidatura?.naoLidas ?? 0) > 0 && (
                  <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {candidatura?.naoLidas}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Candidatura pendente */}
          {candidatura?.estado === "PENDENTE" && (
            <>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} strokeWidth={2} className="text-[#00A99D]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-700">Candidatura enviada</p>
                  <p className="text-xs text-teal-500 mt-0.5">A aguardar resposta da clínica</p>
                </div>
              </div>
              <Link
                href={`/medico/plantoes/${plantao.id}/mensagens`}
                className="relative flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 font-semibold py-3 rounded-2xl text-sm"
              >
                <MessageCircle size={15} strokeWidth={2} />
                Mensagens com a clínica
                {candidatura.naoLidas > 0 && (
                  <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {candidatura.naoLidas}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Aceite + em andamento */}
          {candidatura?.estado === "ACEITE" && plantao.estado === "EM_ANDAMENTO" && (
            <>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Activity size={15} strokeWidth={2} className="text-[#00A99D]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-700">Estás de plantão agora!</p>
                  <p className="text-xs text-[#00A99D] mt-0.5">Termina às {formatHora(dataFim)}</p>
                </div>
              </div>
              <TerminarPlantaoButton plantaoId={plantao.id} />
              <Link
                href={`/medico/plantoes/${plantao.id}/mensagens`}
                className="relative flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 font-semibold py-3 rounded-2xl text-sm"
              >
                <MessageCircle size={15} strokeWidth={2} />
                Mensagens
                {candidatura.naoLidas > 0 && (
                  <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {candidatura.naoLidas}
                  </span>
                )}
              </Link>
              <DisputaButton candidaturaId={candidatura.id} />
            </>
          )}

          {/* Aceite + concluído */}
          {candidatura?.estado === "ACEITE" && plantao.estado === "CONCLUIDO" && (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy size={15} strokeWidth={2} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">Plantão concluído!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Pagamento creditado na carteira</p>
                </div>
              </div>
              <Link
                href="/medico/ganhos"
                className="block w-full text-center bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg"
              >
                Ver carteira
              </Link>
            </>
          )}

          {/* Aceite + esperando início */}
          {candidatura?.estado === "ACEITE" && plantao.estado !== "EM_ANDAMENTO" && plantao.estado !== "CONCLUIDO" && (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} strokeWidth={2} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700">Candidatura aceite!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Confirma presença no plantão</p>
                </div>
              </div>
              <TerminarPlantaoButton plantaoId={plantao.id} />
              <Link
                href={`/medico/plantoes/${plantao.id}/mensagens`}
                className="relative flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 font-semibold py-3 rounded-2xl text-sm"
              >
                <MessageCircle size={15} strokeWidth={2} />
                Mensagens
                {candidatura.naoLidas > 0 && (
                  <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {candidatura.naoLidas}
                  </span>
                )}
              </Link>
              <DisputaButton candidaturaId={candidatura.id} />
            </>
          )}

          {/* Concluído (candidatura) */}
          {candidatura?.estado === "CONCLUIDO" && (
            <>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Trophy size={15} strokeWidth={2} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-teal-700">Plantão terminado!</p>
                  <p className="text-xs text-teal-500 mt-0.5">A aguardar que a clínica libere o pagamento</p>
                </div>
              </div>
              <Link
                href="/medico/ganhos"
                className="block w-full text-center bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg"
              >
                Ver carteira
              </Link>
            </>
          )}

          {/* Recusado */}
          {candidatura?.estado === "RECUSADO" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <XCircleIcon size={15} strokeWidth={2} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600">Candidatura não seleccionada</p>
                <p className="text-xs text-red-400 mt-0.5">Continua a explorar outros plantões</p>
              </div>
            </div>
          )}

          {/* Plantão não disponível sem candidatura */}
          {plantao.estado !== "ABERTO" && !candidatura && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Lock size={15} strokeWidth={2} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Este plantão já não está disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
