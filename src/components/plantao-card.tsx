import { Plantao, formatAOA, formatData, formatHora, calcularDuracao } from "@/lib/mock-data";
import Link from "next/link";
import {
  Check, X, MapPin, Stethoscope, Calendar, Clock, Banknote, Users, BadgeCheck,
} from "lucide-react";

const tipoProfissionalLabel: Record<string, string> = {
  MEDICO: "Médico",
  ENFERMEIRO: "Enfermeiro",
  TECNICO_SAUDE: "Técnico Saúde",
  OUTRO: "Outro",
};

function EstadoBadge({ estado }: { estado: Plantao["estado"] }) {
  const map: Record<Plantao["estado"], { label: string; cls: string }> = {
    ABERTO:       { label: "Aberto",        cls: "bg-success-50 text-success-700" },
    FECHADO:      { label: "Fechado",       cls: "bg-blue-50 text-blue-700" },
    EM_ANDAMENTO: { label: "Em andamento",  cls: "bg-warning-50 text-warning-500" },
    CONCLUIDO:    { label: "Concluído",     cls: "bg-gray-100 text-gray-600" },
    CANCELADO:    { label: "Cancelado",     cls: "bg-danger-50 text-danger-500" },
  };
  const { label, cls } = map[estado];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

function EquipBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        ok ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-400 line-through"
      }`}
    >
      {ok ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />} {label}
    </span>
  );
}

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
  const { clinica, tipoProfissional, especialidade, dataInicio, dataFim, valorKwanzas, vagas, vagasPreenchidas, estado, equipamentos } = plantao;
  const eq = equipamentos;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header da clínica */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-gray-900">{clinica.nome}</p>
              {clinica.verified && (
                <BadgeCheck size={14} className="text-success-500" strokeWidth={2} />
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={11} strokeWidth={1.75} />
              {clinica.cidade}, {clinica.provincia}
            </p>
          </div>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-1.5">
        {tipoProfissional && (
          <span className="inline-block text-xs font-semibold bg-blue-50 text-[#1A6FBB] px-2 py-0.5 rounded-full mb-0.5">
            {tipoProfissionalLabel[tipoProfissional] ?? tipoProfissional}
          </span>
        )}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Stethoscope size={13} strokeWidth={1.75} />
            <span className="text-gray-800 font-medium">{especialidade}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Calendar size={13} strokeWidth={1.75} />
            <span className="text-gray-800">{formatData(dataInicio)}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Clock size={13} strokeWidth={1.75} />
            <span className="text-gray-800">{formatHora(dataInicio)} – {formatHora(dataFim)}</span>
            <span className="text-gray-400">({calcularDuracao(dataInicio, dataFim)})</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Banknote size={13} strokeWidth={1.75} />
            <span className="text-brand-600 font-bold">{formatAOA(valorKwanzas)}</span>
          </span>
          <span className="text-gray-400">·</span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <Users size={13} strokeWidth={1.75} />
            {vagas - vagasPreenchidas} vaga{vagas - vagasPreenchidas !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <EquipBadge ok={eq.maca} label="Maca" />
          <EquipBadge ok={eq.estetoscopio} label="Estetoscópio" />
          <EquipBadge ok={eq.tensiometro} label="Tensiômetro" />
          <EquipBadge ok={eq.termometro} label="Termómetro" />
          <EquipBadge ok={eq.computador} label="Computador" />
        </div>
      </div>

      {/* Footer */}
      {(showCandidatarBtn || showCandidatos) && (
        <div className="px-4 pb-4 flex items-center gap-2">
          {showCandidatos && (
            <span className="text-xs text-gray-500 flex-1">
              {plantao.candidatos ?? 0} candidato{(plantao.candidatos ?? 0) !== 1 ? "s" : ""}
            </span>
          )}
          {showCandidatarBtn && estado === "ABERTO" && (
            <Link
              href={`${basePath}/${plantao.id}`}
              className="flex-1 text-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              CANDIDATAR-ME
            </Link>
          )}
          {showCandidatos && (
            <Link
              href={`${basePath}/${plantao.id}`}
              className="flex-1 text-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              VER DETALHES
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
