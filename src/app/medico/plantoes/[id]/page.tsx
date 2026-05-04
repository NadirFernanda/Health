import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, Stethoscope, Calendar, Clock, Banknote, Users, CheckCircle, XCircle, BadgeCheck, AlertTriangle, MessageCircle, CheckCircle2, XCircle as XCircleIcon } from "lucide-react";

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

  // Verificar candidatura do médico autenticado (se houver sessão)
  let candidatura: { id: string; estado: string; naoLidas: number } | null = null;
  const session = await getAuthSession();
  if (session?.role === "MEDICO") {
    const prof = await getProfissionalFromSession(session);
    if (prof) {
      const cand = await prisma.candidatura.findUnique({
        where: { plantaoId_profissionalId: { plantaoId: id, profissionalId: prof.id } },
        include: { _count: { select: { mensagens: true } } },
      });
      if (cand) {
        const naoLidas = await prisma.mensagem.count({
          where: { candidaturaId: cand.id, lida: false, autorUserId: { not: session.id } },
        });
        candidatura = { id: cand.id, estado: cand.estado, naoLidas };
      }
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

        {candidatura?.estado === "ACEITE" && (
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
              <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1" strokeWidth={2} />
              <p className="text-sm font-bold text-green-700">Candidatura aceite!</p>
              <p className="text-xs text-green-600 mt-0.5">Confirma presença no plantão</p>
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
