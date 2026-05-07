import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, Stethoscope, Calendar, Clock, Banknote, Users, CheckCircle, XCircle, BadgeCheck, AlertTriangle, MessageCircle, CheckCircle2, XCircle as XCircleIcon, FileText, Activity, Trophy, Lock } from "lucide-react";
import { DisputaButton } from "./DisputaButton";
import MedicoCandidaturaActions from "./MedicoCandidaturaActions";
import TerminarPlantaoButton from "./TerminarPlantaoButton";
import LiberarPagamentoButton from "@/app/clinica/plantoes/[id]/LiberarPagamentoButton";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-PT").format(v) + " AOA"; }
function formatData(d: Date) { return d.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }
function formatHora(d: Date) { return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }); }
function calcularDuracao(inicio: Date, fim: Date) {
  const h = Math.round((fim.getTime() - inicio.getTime()) / 3600000);
  return `${h}h`;
}

export default async function DetalhePlantao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plantao = await prisma.plantao.findUnique({
    where: { id },
    include: { clinica: true, profissionalPublicador: true },
  });
  if (!plantao) return notFound();

  const session = await getAuthSession();
  const prof = session?.role === "MEDICO" ? await getProfissionalFromSession(session) : null;

  // Se o médico é o publicador deste plantão → mostrar vista de gestão
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
      where: { plantaoId: id, estado: "CONFIRMADO" },
      select: { id: true, candidaturaId: true, beneficiarioProfissionalId: true, valorLiquidoAoa: true, liberadoEm: true },
    });
    function escrowParaCandidaturaMedico(candId: string, profId: string) {
      return escrowsMedico.find((e) => e.candidaturaId === candId || e.beneficiarioProfissionalId === profId) ?? null;
    }

    const estadoCand: Record<string, { label: string; cls: string }> = {
      PENDENTE:             { label: "Pendente",          cls: "bg-yellow-50 text-yellow-700" },
      CONTRATO_PENDENTE:    { label: "Contrato enviado",  cls: "bg-blue-50 text-blue-700" },
      AGUARDANDO_PAGAMENTO: { label: "Ag. pagamento",     cls: "bg-amber-50 text-amber-700" },
      ACEITE:               { label: "Aceite",            cls: "bg-green-50 text-green-700" },
      CONCLUIDO:            { label: "Concluído",         cls: "bg-teal-50 text-teal-700" },
      RECUSADO:             { label: "Recusado",          cls: "bg-red-50 text-red-600" },
      CANCELADA:            { label: "Cancelada",         cls: "bg-gray-100 text-gray-500" },
    };

    return (
      <div className="pb-28">
        <TopBar titulo="Candidatos" back="/medico/plantoes" />

        {/* Resumo */}
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
              <p className="text-xs text-gray-300 mt-1">Partilha o teu plantão para receber candidatos.</p>
            </div>
          )}

          {candidaturas.map((c) => {
            const est = estadoCand[c.estado] ?? { label: c.estado, cls: "bg-gray-100 text-gray-500" };
            const naoLidas = naoLidasMap[c.id] ?? 0;
            const iniciais = c.profissional.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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

                {c.mensagem && (
                  <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">
                    &ldquo;{c.mensagem}&rdquo;
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/medico/medicos/${c.profissional.id}`}
                    className="flex items-center justify-center gap-1 border border-[#0B3C74]/20 text-[#0B3C74] font-semibold py-2.5 px-3 rounded-xl text-xs"
                  >
                    Ver Perfil
                  </Link>
                  <Link
                    href={`/medico/plantoes/${id}/mensagens`}
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
                  {c.estado === "CONCLUIDO" && (() => {
                    const escrow = escrowParaCandidaturaMedico(c.id, c.profissional.id);
                    const valorLiquido = escrow?.valorLiquidoAoa ?? Math.round(plantao.valorKwanzas * 0.90);
                    return (
                      <div className="flex-1 space-y-1">
                        {escrow?.liberadoEm ? (
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

  // Vista normal: médico a ver um plantão como candidato
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
        } catch (msgErr) {
          console.error("[Plantao Detail] Error counting messages:", msgErr);
        }
        candidatura = { id: cand.id, estado: cand.estado, naoLidas };
      }
    } catch (candErr) {
      console.error("[Plantao Detail] Error loading candidatura:", candErr);
    }
  }

  const { clinica, profissionalPublicador, especialidade, dataInicio, dataFim, valorKwanzas, vagas, vagasPreenchidas, descricao } = plantao;

  const equipList = [
    { label: "Maca de exame", ok: plantao.maca },
    { label: "Estetoscópio", ok: plantao.estetoscopio },
    { label: "Tensiômetro", ok: plantao.tensiometro },
    { label: "Termómetro", ok: plantao.termometro },
    { label: "Computador", ok: plantao.computador },
    { label: "Materiais básicos", ok: plantao.materiaisBasicos },
    { label: "Nebulizador", ok: plantao.nebulizador },
    { label: "Oxímetro", ok: plantao.oximetro },
    { label: "Glucómetro", ok: plantao.glucometro },
    { label: "Desfibrilador", ok: plantao.desfibrilador },
  ];

  return (
    <div>
      <TopBar titulo="Detalhe do Plantão" back={clinica ? "/medico/buscar" : "/medico/plantoes"} />

      {/* Header clínica ou médico publicador */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-bold text-[#0B3C74]">
            {clinica ? clinica.nome.charAt(0) : (profissionalPublicador?.nome?.charAt(0) ?? "M")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-base">
                {clinica ? clinica.nome : (profissionalPublicador?.nome ?? "Médico")}
              </h2>
              {(clinica?.verified || profissionalPublicador?.verified) && (
                <BadgeCheck size={15} strokeWidth={2} className="text-[#00A99D]" />
              )}
            </div>
            {clinica ? (
              <>
                <p className="flex items-center gap-1 text-gray-500 text-sm"><MapPin size={12} strokeWidth={1.75} /> {clinica.cidade}, {clinica.provincia}</p>
                <p className="flex items-center gap-1 text-yellow-500 text-xs mt-0.5"><Star size={11} strokeWidth={1.75} fill="currentColor" /> {clinica.rating} ({clinica.totalAvaliacoes} avaliações)</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm">Plantão publicado por médico</p>
                {profissionalPublicador?.especialidade && (
                  <p className="text-gray-400 text-xs mt-0.5">{profissionalPublicador.especialidade}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner de estado do plantão */}
      {plantao.estado === "EM_ANDAMENTO" && (
        <div className="mx-4 mt-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Activity size={18} strokeWidth={2} className="text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-orange-700">Plantão em andamento</p>
            <p className="text-xs text-orange-500">A decorrer agora · termina às {formatHora(dataFim)}</p>
          </div>
        </div>
      )}
      {plantao.estado === "CONCLUIDO" && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Trophy size={18} strokeWidth={2} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">Plantão concluído</p>
            <p className="text-xs text-green-500">Pagamento creditado na carteira</p>
          </div>
        </div>
      )}
      {plantao.estado === "CANCELADO" && (
        <div className="mx-4 mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <XCircle size={18} strokeWidth={2} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">Este plantão foi cancelado</p>
        </div>
      )}
      {plantao.estado === "FECHADO" && !candidatura && (
        <div className="mx-4 mt-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Lock size={18} strokeWidth={2} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">Todas as vagas preenchidas</p>
        </div>
      )}

      {/* Dados */}
      <div className="bg-white mt-2 px-4 py-4 space-y-2.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Dados do Plantão</h3>
        {[
          { icon: <Stethoscope size={16} strokeWidth={1.75} />, label: especialidade },
          { icon: <Calendar size={16} strokeWidth={1.75} />, label: formatData(dataInicio) },
          { icon: <Clock size={16} strokeWidth={1.75} />, label: `${formatHora(dataInicio)} – ${formatHora(dataFim)} (${calcularDuracao(dataInicio, dataFim)})` },
          { icon: <Banknote size={16} strokeWidth={1.75} />, label: formatAOA(valorKwanzas), bold: true },
          { icon: <Users size={16} strokeWidth={1.75} />, label: `${vagas - vagasPreenchidas} vaga(s) disponível(eis)` },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 w-5 shrink-0">{item.icon}</span>
            <span className={item.bold ? "font-bold text-[#0B3C74] text-base" : "text-gray-800"}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Equipamentos */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Equipamentos Disponíveis</h3>
        <div className="space-y-2">
          {equipList.map((e) => (
            <div key={e.label} className="flex items-center gap-2.5 text-sm">
              <span className={e.ok ? "text-[#00A99D]" : "text-red-400"}>
                {e.ok ? <CheckCircle size={16} strokeWidth={2} /> : <XCircle size={16} strokeWidth={2} />}
              </span>
              <span className={e.ok ? "text-gray-800" : "text-gray-400 line-through"}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Descrição */}
      {descricao && (
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descrição</h3>
          <p className="text-sm text-gray-700 leading-6">{descricao}</p>
        </div>
      )}

      {/* CTA — varia conforme o estado da candidatura */}
      <div className="px-4 py-6 space-y-3">
        {!candidatura && plantao.estado === "ABERTO" && (
          <>
            <Link
              href={`/medico/plantoes/${plantao.id}/confirmar`}
              className="block w-full text-center bg-[#0B3C74] hover:bg-[#00A99D] text-white font-bold py-4 rounded-2xl transition-colors text-base"
            >
              CANDIDATAR-ME
            </Link>
            <p className="text-center text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle size={13} strokeWidth={2} className="text-yellow-500" />
                Só médicos com perfil verificado podem candidatar-se
              </span>
            </p>
          </>
        )}

        {candidatura?.estado === "CONTRATO_PENDENTE" && (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center">
              <FileText size={22} className="text-blue-500 mx-auto mb-2" strokeWidth={1.75} />
              <p className="text-sm font-bold text-blue-800">Contrato para assinar</p>
              <p className="text-xs text-blue-600 mt-0.5">A clínica aceitou a sua candidatura. Reveja e assine o contrato para confirmar.</p>
            </div>
            <Link
              href={`/medico/plantoes/${plantao.id}/contrato`}
              className="block w-full text-center bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-base active:scale-[0.99] transition-transform"
            >
              VER E ASSINAR CONTRATO
            </Link>
            <Link
              href={`/medico/plantoes/${plantao.id}/mensagens`}
              className="relative flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Mensagens com a clínica
              {(candidatura?.naoLidas ?? 0) > 0 && (
                <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {candidatura?.naoLidas}
                </span>
              )}
            </Link>
          </div>
        )}

        {candidatura?.estado === "PENDENTE" && (
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-yellow-700">Candidatura enviada</p>
              <p className="text-xs text-yellow-600 mt-0.5">A aguardar resposta da clínica</p>
            </div>
            <Link
              href={`/medico/plantoes/${plantao.id}/mensagens`}
              className="relative flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Mensagens com a clínica
              {candidatura.naoLidas > 0 && (
                <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {candidatura.naoLidas}
                </span>
              )}
            </Link>
          </div>
        )}

        {candidatura?.estado === "ACEITE" && plantao.estado === "EM_ANDAMENTO" && (
          <div className="space-y-2">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-center">
              <Activity size={20} className="text-orange-500 mx-auto mb-1" strokeWidth={2} />
              <p className="text-sm font-bold text-orange-700">Estás de plantão agora!</p>
              <p className="text-xs text-orange-500 mt-0.5">O plantão está em andamento · termina às {formatHora(dataFim)}</p>
            </div>
            <TerminarPlantaoButton plantaoId={plantao.id} />
            <Link
              href={`/medico/plantoes/${plantao.id}/mensagens`}
              className="relative flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Mensagens com a clínica
              {candidatura.naoLidas > 0 && (
                <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {candidatura.naoLidas}
                </span>
              )}
            </Link>
            <DisputaButton candidaturaId={candidatura.id} />
          </div>
        )}

        {candidatura?.estado === "ACEITE" && plantao.estado === "CONCLUIDO" && (
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
              <Trophy size={20} className="text-green-500 mx-auto mb-1" strokeWidth={2} />
              <p className="text-sm font-bold text-green-700">Plantão concluído!</p>
              <p className="text-xs text-green-500 mt-0.5">O pagamento foi creditado na tua carteira</p>
            </div>
            <Link
              href="/medico/ganhos"
              className="block w-full text-center bg-[#00A99D] text-white font-bold py-3 rounded-2xl text-sm"
            >
              Ver carteira
            </Link>
          </div>
        )}

        {candidatura?.estado === "ACEITE" && plantao.estado !== "EM_ANDAMENTO" && plantao.estado !== "CONCLUIDO" && (
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
              <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1" strokeWidth={2} />
              <p className="text-sm font-bold text-green-700">Candidatura aceite!</p>
              <p className="text-xs text-green-600 mt-0.5">Confirma presença no plantão</p>
            </div>
            <TerminarPlantaoButton plantaoId={plantao.id} />
            <Link
              href={`/medico/plantoes/${plantao.id}/mensagens`}
              className="relative flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm"
            >
              <MessageCircle size={16} strokeWidth={2} />
              Mensagens com a clínica
              {candidatura.naoLidas > 0 && (
                <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {candidatura.naoLidas}
                </span>
              )}
            </Link>
            <DisputaButton candidaturaId={candidatura.id} />
          </div>
        )}

        {candidatura?.estado === "CONCLUIDO" && (
          <div className="space-y-2">
            <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 text-center">
              <Trophy size={20} className="text-teal-500 mx-auto mb-1" strokeWidth={2} />
              <p className="text-sm font-bold text-teal-700">Plantão terminado!</p>
              <p className="text-xs text-teal-600 mt-0.5">A aguardar que a clínica libere o pagamento</p>
            </div>
            <Link
              href="/medico/ganhos"
              className="block w-full text-center bg-[#00A99D] text-white font-bold py-3 rounded-2xl text-sm"
            >
              Ver carteira
            </Link>
          </div>
        )}

        {candidatura?.estado === "RECUSADO" && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-center">
            <XCircleIcon size={20} className="text-red-400 mx-auto mb-1" strokeWidth={2} />
            <p className="text-sm font-semibold text-red-600">Candidatura não seleccionada</p>
            <p className="text-xs text-red-400 mt-0.5">Continua a explorar outros plantões</p>
          </div>
        )}

        {plantao.estado !== "ABERTO" && !candidatura && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-sm text-gray-500">Este plantão já não está disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
