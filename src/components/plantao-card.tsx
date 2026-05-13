import { Plantao, formatAOA, formatData, formatHora, calcularDuracao } from "@/lib/mock-data";
import Link from "next/link";
import { MapPin, Calendar, Clock, BadgeCheck, UserRound } from "lucide-react";

const tipoProfissionalLabel: Record<string, string> = {
  MEDICO: "Médico",
  ENFERMEIRO: "Enfermeiro",
  TECNICO_SAUDE: "Téc. Saúde",
  OUTRO: "Outro",
};

const estadoMap: Record<string, { label: string; cls: string }> = {
  ABERTO:       { label: "Aberto",       cls: "bg-emerald-50 text-emerald-700" },
  FECHADO:      { label: "Fechado",      cls: "bg-blue-50 text-blue-700" },
  EM_ANDAMENTO: { label: "Em andamento", cls: "bg-teal-50 text-teal-700" },
  CONCLUIDO:    { label: "Concluído",    cls: "bg-gray-100 text-gray-500" },
  CANCELADO:    { label: "Cancelado",    cls: "bg-red-50 text-red-600" },
};

const equipLabels: Record<string, string> = {
  maca: "Maca", estetoscopio: "Estetoscópio", tensiometro: "Tensiómetro",
  termometro: "Termómetro", computador: "Computador", materiaisBasicos: "Mat. Básicos",
  nebulizador: "Nebulizador", oximetro: "Oxímetro", glucometro: "Glucómetro",
  desfibrilador: "Desfibrilador",
};

interface PlantaoCardProps {
  plantao: Plantao;
  basePath?: string;
  showCandidatarBtn?: boolean;
  showCandidatos?: boolean;
}

export function PlantaoCard({
  plantao,
  basePath = "/medico/plantoes",
  showCandidatarBtn = true,
  showCandidatos = false,
}: PlantaoCardProps) {
  const {
    clinica, tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, vagasPreenchidas, estado, equipamentos,
  } = plantao as Plantao & { publicadoPorMedico?: boolean; profissionalPublicador?: { nome: string; especialidade: string } | null };

  const isSubstituto = (plantao as { publicadoPorMedico?: boolean }).publicadoPorMedico;
  const profPublicador = (plantao as { profissionalPublicador?: { nome: string; especialidade: string } | null }).profissionalPublicador;

  const headerNome = isSubstituto && profPublicador ? profPublicador.nome : clinica?.nome ?? "";
  const headerSub = isSubstituto && profPublicador
    ? profPublicador.especialidade
    : [clinica?.cidade, clinica?.provincia].filter(Boolean).join(", ");

  const vagasLivres = vagas - vagasPreenchidas;
  const { label: estadoLabel, cls: estadoCls } = estadoMap[estado] ?? { label: estado, cls: "bg-gray-100 text-gray-500" };

  const equipPresentes = Object.entries(equipamentos ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => equipLabels[k] ?? k);

  return (
    <Link
      href={`${basePath}/${plantao.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSubstituto && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">
                <UserRound size={9} strokeWidth={2} /> Substituto
              </span>
            )}
            <p className="font-bold text-sm text-gray-900 truncate">{headerNome}</p>
            {!isSubstituto && clinica?.verified && (
              <BadgeCheck size={14} className="text-emerald-500 shrink-0" strokeWidth={2} />
            )}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
            <MapPin size={10} strokeWidth={1.75} />
            {headerSub}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${estadoCls}`}>
          {estadoLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2">
        {/* Tipo + Especialidade */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold bg-[#0B3C74]/10 text-[#0B3C74] px-2 py-0.5 rounded-full">
            {tipoProfissionalLabel[tipoProfissional] ?? tipoProfissional}
          </span>
          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {especialidade}
          </span>
        </div>

        {/* Data + Hora + Duração numa linha */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar size={12} strokeWidth={1.75} className="text-gray-400" />
            {formatData(dataInicio)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={1.75} className="text-gray-400" />
            {formatHora(dataInicio)}–{formatHora(dataFim)}
            <span className="text-gray-400">({calcularDuracao(dataInicio, dataFim)})</span>
          </span>
        </div>

        {/* Valor + Vagas */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#00A99D]">{formatAOA(valorKwanzas)}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-500">
            {vagasLivres} vaga{vagasLivres !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Equipamentos — só os disponíveis */}
      {equipPresentes.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {equipPresentes.map((label) => (
              <span key={label} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {(showCandidatarBtn || showCandidatos) && (
        <div className="px-4 pb-4 pt-1 flex gap-2">
          {showCandidatos && (
            <span className="flex-1 text-center text-xs text-gray-400">
              {plantao.candidatos ?? 0} candidato{(plantao.candidatos ?? 0) !== 1 ? "s" : ""}
            </span>
          )}
          {showCandidatarBtn && estado === "ABERTO" && (
            <span className="flex-1 text-center bg-[#00A99D] text-white text-xs font-bold py-2.5 rounded-xl tracking-wide">
              CANDIDATAR-ME
            </span>
          )}
          {showCandidatos && (
            <span className="flex-1 text-center bg-[#0B3C74] text-white text-xs font-bold py-2.5 rounded-xl tracking-wide">
              VER DETALHES
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
