"use client";
import React, { useState, useRef } from "react";
import { medicoLogado } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { logoutAction } from "@/app/actions/auth";
import { BadgeCheck, Star, ClipboardList, Stethoscope, MapPin, CheckCircle, Clock, Paperclip, Lock, Check, ChevronRight } from "lucide-react";

type DocEstado = "APROVADO" | "PENDENTE" | "NAO_ENVIADO";

interface Documento {
  label: string;
  estado: DocEstado;
  ficheiro?: string;
}

export default function PerfilMedico() {
  const m = medicoLogado;

  const [docs, setDocs] = useState<Documento[]>([
    { label: "Cédula da Ordem dos Médicos", estado: "APROVADO", ficheiro: "cedula_ordem.pdf" },
    { label: "Bilhete de Identidade", estado: "APROVADO", ficheiro: "bi_joao_silva.pdf" },
    { label: "Licenciatura em Medicina (UJES)", estado: "APROVADO", ficheiro: "licenciatura_medicina.pdf" },
    { label: "Comprovativo de SINOME", estado: "PENDENTE", ficheiro: "sinome_2026.pdf" },
    { label: "Certificado de Especialidade (opcional)", estado: "NAO_ENVIADO" },
  ]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleUpload = (index: number, file: File | undefined) => {
    if (!file) return;
    setDocs((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, ficheiro: file.name, estado: "PENDENTE" } : d
      )
    );
  };

  const estadoConfig: Record<DocEstado, { cls: string; icon: React.ReactNode; label: string }> = {
    APROVADO:    { cls: "text-success-500", icon: <CheckCircle size={15} strokeWidth={2} />, label: "Verificado" },
    PENDENTE:    { cls: "text-yellow-500",  icon: <Clock size={15} strokeWidth={2} />,       label: "Em análise" },
    NAO_ENVIADO: { cls: "text-gray-300",    icon: <Paperclip size={15} strokeWidth={2} />,   label: "Não enviado" },
  };

  const avaliacoes = [
    { stars: 5, texto: "Excelente profissional, pontual e muito atencioso.", clinica: "Clínica Saúde+", data: "Mar 2026" },
    { stars: 4, texto: "Boa comunicação, cumpriu o horário sem problemas.", clinica: "Clínica Horizonte", data: "Fev 2026" },
    { stars: 5, texto: "Recomendo! Muito competente.", clinica: "Clínica Central", data: "Jan 2026" },
  ];

  return (
    <div>
      <TopBar titulo="O meu Perfil" back="/medico" />

      {/* Avatar e nome */}
      <div className="bg-white px-4 py-6 flex flex-col items-center border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-[#1A6FBB] mb-3">
          {m.nome.split(" ")[1]?.charAt(0) ?? "J"}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{m.nome}</h1>
        {m.verified && (
          <span className="mt-1.5 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            <BadgeCheck size={13} strokeWidth={2} /> VERIFICADO
          </span>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Star size={14} strokeWidth={1.75} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-800">{m.rating}</span>
          <span className="text-gray-400 text-xs">({m.totalAvaliacoes} avaliações)</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{m.especialidade} · {m.provincia}</p>
      </div>

      {/* Estatísticas */}
      <div className="bg-white grid grid-cols-3 border-b border-gray-100">
        {[
          { label: "Plantões", value: m.totalPlantoes },
          { label: "Avaliações", value: m.totalAvaliacoes },
          { label: "Saldo (AOA)", value: (m.saldoCarteira / 1000).toFixed(0) + "k" },
        ].map((s) => (
          <div key={s.label} className="text-center py-4 border-r border-gray-100 last:border-r-0">
            <p className="text-xl font-bold text-[#1A6FBB]">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Informações */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informações Profissionais</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="flex items-center gap-2"><ClipboardList size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" /> Nº Ordem: <span className="font-mono text-gray-900">{m.numeroOrdem}</span></p>
          {m.numeroSinome && <p className="flex items-center gap-2"><ClipboardList size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" /> Nº SINOME: <span className="font-mono text-gray-900">{m.numeroSinome}</span></p>}
          <p className="flex items-center gap-2"><Stethoscope size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" /> Especialidade: {m.especialidade}</p>
          <p className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" /> Localização: {m.provincia}</p>
          <p className="text-gray-600 leading-5 mt-1">{m.bio}</p>
        </div>
      </div>

      {/* Verificação Express */}
      {!m.verified && (
        <div className="mx-4 mt-4 bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Lock size={22} strokeWidth={1.75} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Perfil não verificado</p>
              <p className="text-xs text-orange-600 mt-1 leading-5">
                A Verificação Express desbloqueia candidaturas a plantões e aumenta a sua taxa de aceitação.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-orange-700">
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Confirmação do SINOME / Ordem</p>
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Validação de BI/Passaporte</p>
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Prazo: 24–48h · Taxa única: <strong>2.500 AOA</strong></p>
              </div>
              <button className="mt-3 w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm inline-flex items-center justify-center gap-1">
                Iniciar Verificação Express <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentos / Upload */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Documentos</h3>
          <span className="text-xs text-gray-400">
            {docs.filter((d) => d.estado === "APROVADO").length}/{docs.length} verificados
          </span>
        </div>
        <div className="space-y-3">
          {docs.map((doc, i) => {
            const cfg = estadoConfig[doc.estado];
            return (
              <div key={doc.label} className="flex items-center gap-3">
                <span className={`shrink-0 ${cfg.cls}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{doc.label}</p>
                  {doc.ficheiro ? (
                    <p className="text-xs text-gray-400 font-mono truncate">{doc.ficheiro}</p>
                  ) : (
                    <p className="text-xs text-gray-300">Nenhum ficheiro</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                  {/* Inputs escondidos */}
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleUpload(i, e.target.files?.[0])}
                  />
                  {doc.estado !== "APROVADO" && (
                    <button
                      onClick={() => inputRefs.current[i]?.click()}
                      className="text-xs text-brand-500 font-semibold border border-brand-200 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      {doc.estado === "NAO_ENVIADO" ? "Carregar" : "Substituir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">Formatos aceites: PDF, JPG, PNG · Máx. 10 MB por ficheiro</p>
      </div>

      {/* Avaliações */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Avaliações Recentes</h3>
        <div className="space-y-3">
          {avaliacoes.map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: a.stars }).map((_, j) => (
                  <Star key={j} size={12} strokeWidth={1.75} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-5">&ldquo;{a.texto}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">— {a.clinica}, {a.data}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 py-4 space-y-2">
        <button className="w-full border border-[#1A6FBB] text-[#1A6FBB] font-semibold py-3 rounded-2xl text-sm">
          Editar Perfil
        </button>
        <form action={logoutAction}>
          <button type="submit" className="w-full text-center text-red-500 font-semibold py-3 text-sm">
            Terminar Sessão
          </button>
        </form>
      </div>
    </div>
  );
}
