import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import { redirect, notFound } from "next/navigation";
import { BadgeCheck, FileText, MapPin, Calendar, Clock, Banknote, ShieldCheck } from "lucide-react";
import ContratoActions from "./ContratoActions";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-PT").format(v) + " AOA";
}
function formatData(d: Date) {
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function formatHora(d: Date) {
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}
function calcularDuracao(inicio: Date, fim: Date) {
  const h = Math.round((fim.getTime() - inicio.getTime()) / 3600000);
  return `${h}h`;
}

export default async function ContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: plantaoId } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");

  const prof = await getProfissionalFromSession(session);
  if (!prof) redirect("/login");

  const candidatura = await prisma.candidatura.findUnique({
    where: { plantaoId_profissionalId: { plantaoId, profissionalId: prof.id } },
    include: {
      plantao: { include: { clinica: true } },
    },
  });

  if (!candidatura) return notFound();
  if (candidatura.estado !== "CONTRATO_PENDENTE") {
    redirect(`/medico/plantoes/${plantaoId}`);
  }

  const { plantao } = candidatura;
  const clinica = plantao.clinica;
  const duracao = calcularDuracao(plantao.dataInicio, plantao.dataFim);
  const valorLiquido = Math.round(plantao.valorKwanzas * 0.9);
  const dataFormatada = formatData(plantao.dataInicio);
  const horaInicio = formatHora(plantao.dataInicio);
  const horaFim = formatHora(plantao.dataFim);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <TopBar titulo="Contrato de Prestação" back={`/medico/plantoes/${plantaoId}`} />

      {/* Header */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl font-bold text-[#0B3C74] shrink-0">
            {clinica?.nome.charAt(0) ?? "M"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-gray-900">{clinica?.nome ?? "Clínica"}</p>
              {clinica?.verified && (
                <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D]" />
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={11} strokeWidth={1.75} />
              {clinica?.cidade ?? ""}{clinica?.provincia ? `, ${clinica.provincia}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
          <FileText size={12} strokeWidth={2.5} />
          Contrato aguarda a sua assinatura
        </div>
      </div>

      {/* Resumo do plantão */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Resumo do Plantão</h3>
        <div className="space-y-2.5">
          {[
            { icon: <Calendar size={15} strokeWidth={1.75} />, text: dataFormatada },
            { icon: <Clock size={15} strokeWidth={1.75} />, text: `${horaInicio} – ${horaFim} (${duracao})` },
            { icon: <MapPin size={15} strokeWidth={1.75} />, text: clinica?.morada ?? clinica?.cidade ?? "Ver localização" },
            { icon: <Banknote size={15} strokeWidth={1.75} />, text: formatAOA(plantao.valorKwanzas), bold: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-5 shrink-0">{item.icon}</span>
              <span className={item.bold ? "font-bold text-[#0B3C74]" : "text-gray-800"}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contract document */}
      <div className="bg-white mt-2 mx-4 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-[#0B3C74] px-4 py-3 flex items-center gap-2">
          <FileText size={16} strokeWidth={2} className="text-white" />
          <span className="text-white font-bold text-sm">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</span>
        </div>

        <div className="px-4 py-4 space-y-4 text-sm text-gray-700 leading-relaxed">
          <div className="text-center pb-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Medfreela — Plataforma de Saúde</p>
            <p className="text-xs text-gray-400 mt-0.5">Luanda, Angola</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Partes</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
              <p><span className="font-semibold text-gray-600">PRESTADOR:</span> {prof.nome}{prof.especialidade ? `, ${prof.especialidade}` : ""}</p>
              <p><span className="font-semibold text-gray-600">CONTRATANTE:</span> {clinica?.nome ?? "Clínica"}{clinica?.cidade ? `, ${clinica.cidade}` : ""}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 1 — Objecto</p>
            <p className="text-xs">O prestador obriga-se a prestar serviços de saúde na especialidade de <strong>{plantao.especialidade}</strong>, nas condições e horários abaixo indicados.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 2 — Data e Horário</p>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
              <p><span className="font-semibold">Data:</span> {dataFormatada}</p>
              <p><span className="font-semibold">Horário:</span> {horaInicio} às {horaFim} ({duracao})</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 3 — Local</p>
            <p className="text-xs">{clinica?.nome ?? "Clínica"}{clinica?.morada ? ` — ${clinica.morada}` : ""}{clinica?.cidade ? `, ${clinica.cidade}` : ""}{clinica?.provincia ? `, ${clinica.provincia}` : ""}.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 4 — Remuneração</p>
            <div className="bg-green-50 rounded-xl p-3 text-xs space-y-1">
              <p><span className="font-semibold">Valor bruto:</span> {formatAOA(plantao.valorKwanzas)}</p>
              <p><span className="font-semibold">Comissão plataforma (10%):</span> {formatAOA(Math.round(plantao.valorKwanzas * 0.1))}</p>
              <p><span className="font-semibold text-green-700">Valor líquido a receber:</span> <strong className="text-green-700">{formatAOA(valorLiquido)}</strong></p>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">O pagamento será processado via plataforma Medfreela após a conclusão do plantão.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 5 — Obrigações do Prestador</p>
            <ul className="text-xs space-y-1 list-none">
              {[
                "Comparecer no local acordado com pontualidade.",
                "Apresentar credenciais profissionais actualizadas.",
                "Cumprir os protocolos clínicos da instituição de saúde.",
                "Comunicar antecipadamente qualquer impedimento, com mínimo de 24 horas.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#00A99D] font-bold shrink-0">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 6 — Obrigações do Contratante</p>
            <ul className="text-xs space-y-1 list-none">
              {[
                "Disponibilizar o local e equipamentos acordados.",
                "Garantir condições de trabalho adequadas e seguras.",
                "Efectuar o pagamento nos prazos acordados via plataforma.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#00A99D] font-bold shrink-0">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 7 — Rescisão</p>
            <p className="text-xs">Qualquer parte pode rescindir com antecedência mínima de 24 horas. A rescisão sem causa justificada pode implicar penalizações conforme os Termos Gerais da plataforma Medfreela.</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2">Cláusula 8 — Lei Aplicável</p>
            <p className="text-xs">O presente contrato rege-se pela legislação angolana vigente, nomeadamente a Lei Geral do Trabalho e os regulamentos do Ministério da Saúde de Angola.</p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={13} strokeWidth={2} className="text-[#00A99D] shrink-0" />
              <span>Contrato gerado electronicamente pela plataforma Medfreela. A assinatura digital tem validade jurídica.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-6 space-y-3">
        <ContratoActions candidaturaId={candidatura.id} plantaoId={plantaoId} />
      </div>
    </div>
  );
}
