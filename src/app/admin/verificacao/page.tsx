"use client";

import { useState } from "react";
import { adminMedicosMock, adminClinicasMock, AdminMedico, AdminClinica } from "@/lib/mock-data";
import Link from "next/link";
import { ChevronLeft, Zap, Clock, CheckCircle, XCircle, ChevronRight, User, Building2, AlertTriangle } from "lucide-react";

type Filtro = "TODOS" | "EXPRESS" | "NORMAL";

function horasAtras(criadoEm: string): string {
  const diff = Date.now() - new Date(criadoEm).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return "há menos de 1 hora";
  if (horas < 24) return `há ${horas} hora${horas === 1 ? "" : "s"}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias === 1 ? "" : "s"}`;
}

function BadgeVerificacao({ express }: { express?: boolean }) {
  if (express) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
        <Zap size={10} strokeWidth={2.5} /> EXPRESS 48h
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
      <Clock size={10} strokeWidth={2} /> NORMAL 7 dias
    </span>
  );
}

function CardPendente({
  nome,
  subtitulo,
  numero,
  email,
  criadoEm,
  express,
  tipo,
  onAprovar,
  onRejeitar,
}: {
  nome: string;
  subtitulo: string;
  numero: string;
  email: string;
  criadoEm: string;
  express?: boolean;
  tipo: "profissional" | "clinica";
  onAprovar: () => void;
  onRejeitar: () => void;
}) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${express ? "border-orange-200" : "border-gray-100"}`}>
      <button
        className="w-full px-4 py-4 flex items-center gap-3 text-left"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tipo === "profissional" ? "bg-blue-50" : "bg-green-50"}`}>
          {tipo === "profissional"
            ? <User size={18} strokeWidth={1.75} className="text-[#0B3C74]" />
            : <Building2 size={18} strokeWidth={1.75} className="text-[#00A99D]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{nome}</p>
          <p className="text-xs text-gray-400">{subtitulo} · {horasAtras(criadoEm)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <BadgeVerificacao express={express} />
          <ChevronRight size={14} strokeWidth={1.75} className={`text-gray-400 transition-transform ${expandido ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">E-mail</span>
              <span className="text-gray-900 font-medium">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nº Registo</span>
              <span className="text-gray-900 font-mono text-xs">{numero}</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-xs text-blue-600 flex items-start gap-2">
            <AlertTriangle size={13} strokeWidth={2} className="shrink-0 mt-0.5" />
            <span>Verifique os documentos submetidos antes de aprovar.</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRejeitar}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl"
            >
              <XCircle size={15} strokeWidth={1.75} /> Rejeitar
            </button>
            <button
              onClick={onAprovar}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#00A99D] text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              <CheckCircle size={15} strokeWidth={1.75} /> Aprovar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVerificacaoPage() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [medicos, setMedicos] = useState(adminMedicosMock);
  const [clinicas, setClinicas] = useState(adminClinicasMock);

  const aprovarMedico = (id: string) =>
    setMedicos((prev) => prev.map((m) => m.id === id ? { ...m, estadoVerificacao: "APROVADO" as const, verified: true } : m));
  const rejeitarMedico = (id: string) =>
    setMedicos((prev) => prev.map((m) => m.id === id ? { ...m, estadoVerificacao: "REJEITADO" as const } : m));
  const aprovarClinica = (id: string) =>
    setClinicas((prev) => prev.map((c) => c.id === id ? { ...c, estadoVerificacao: "APROVADO" as const, verified: true } : c));
  const rejeitarClinica = (id: string) =>
    setClinicas((prev) => prev.map((c) => c.id === id ? { ...c, estadoVerificacao: "REJEITADO" as const } : c));

  const medicosPendentes = medicos.filter((m) => m.estadoVerificacao === "PENDENTE");
  const clinicasPendentes = clinicas.filter((c) => c.estadoVerificacao === "PENDENTE");

  const filtrarMedicos = (lista: AdminMedico[]) => {
    if (filtro === "EXPRESS") return lista.filter((m) => m.tipoVerificacao === "EXPRESS");
    if (filtro === "NORMAL") return lista.filter((m) => m.tipoVerificacao !== "EXPRESS");
    return lista;
  };

  const filtrarClinicas = (lista: AdminClinica[]) => {
    if (filtro === "EXPRESS") return [];
    return lista;
  };

  const expressCount = medicosPendentes.filter((m) => m.tipoVerificacao === "EXPRESS").length;
  const totalPendentes = medicosPendentes.length + clinicasPendentes.length;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ChevronLeft size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="text-white font-bold text-lg">Verificação de Credenciais</h1>
        </div>
        <p className="text-blue-200 text-sm">{totalPendentes} pendente{totalPendentes !== 1 ? "s" : ""} · {expressCount} express ⚡</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Filtros */}
        <div className="flex gap-2">
          {(["TODOS", "EXPRESS", "NORMAL"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filtro === f
                  ? "bg-[#0B3C74] text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {f === "EXPRESS" && <Zap size={11} strokeWidth={2.5} />}
              {f === "NORMAL" && <Clock size={11} strokeWidth={2} />}
              {f}
            </button>
          ))}
        </div>

        {/* Express */}
        {filtro !== "NORMAL" && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} strokeWidth={2.5} className="text-orange-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Express (48h) — {filtrarMedicos(medicosPendentes).filter((m) => m.tipoVerificacao === "EXPRESS").length} pendentes
              </h2>
            </div>
            <div className="space-y-3">
              {filtrarMedicos(medicosPendentes)
                .filter((m) => m.tipoVerificacao === "EXPRESS")
                .map((m) => (
                  <CardPendente
                    key={m.id}
                    nome={m.nome}
                    subtitulo={`${m.especialidade} (${m.tipo === "MEDICO" ? "Médico" : m.tipo === "ENFERMEIRO" ? "Enfermeiro" : "Técnico"})`}
                    numero={m.numeroSinome}
                    email={m.email}
                    criadoEm={m.criadoEm}
                    express
                    tipo="profissional"
                    onAprovar={() => aprovarMedico(m.id)}
                    onRejeitar={() => rejeitarMedico(m.id)}
                  />
                ))}
              {filtrarMedicos(medicosPendentes).filter((m) => m.tipoVerificacao === "EXPRESS").length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">Nenhuma verificação express pendente ✓</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Normal */}
        {filtro !== "EXPRESS" && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} strokeWidth={2} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Normal (7 dias) — {
                  filtrarMedicos(medicosPendentes).filter((m) => m.tipoVerificacao !== "EXPRESS").length +
                  filtrarClinicas(clinicasPendentes).length
                } pendentes
              </h2>
            </div>
            <div className="space-y-3">
              {filtrarMedicos(medicosPendentes)
                .filter((m) => m.tipoVerificacao !== "EXPRESS")
                .map((m) => (
                  <CardPendente
                    key={m.id}
                    nome={m.nome}
                    subtitulo={`${m.especialidade} (${m.tipo === "MEDICO" ? "Médico" : m.tipo === "ENFERMEIRO" ? "Enfermeiro" : "Técnico"})`}
                    numero={m.numeroSinome}
                    email={m.email}
                    criadoEm={m.criadoEm}
                    tipo="profissional"
                    onAprovar={() => aprovarMedico(m.id)}
                    onRejeitar={() => rejeitarMedico(m.id)}
                  />
                ))}
              {filtrarClinicas(clinicasPendentes).map((c) => (
                <CardPendente
                  key={c.id}
                  nome={c.nome}
                  subtitulo={`Clínica · NIF ${c.nif}`}
                  numero={c.nif}
                  email={c.email}
                  criadoEm={c.criadoEm}
                  tipo="clinica"
                  onAprovar={() => aprovarClinica(c.id)}
                  onRejeitar={() => rejeitarClinica(c.id)}
                />
              ))}
              {filtrarMedicos(medicosPendentes).filter((m) => m.tipoVerificacao !== "EXPRESS").length === 0 &&
               filtrarClinicas(clinicasPendentes).length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">Nenhuma verificação normal pendente ✓</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
