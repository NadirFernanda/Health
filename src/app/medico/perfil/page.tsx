"use client";
import React, { useState, useRef, useEffect } from "react";
import { TopBar } from "@/components/nav";
import { logoutAction } from "@/app/actions/auth";
import {
  BadgeCheck, Star, ClipboardList, Stethoscope, MapPin,
  CheckCircle, Clock, Paperclip, Lock, Check, ChevronRight,
  Pencil, X, Save, ToggleRight, ToggleLeft, Award,
} from "lucide-react";

type DocEstado = "APROVADO" | "PENDENTE" | "NAO_ENVIADO";

interface Documento {
  label: string;
  estado: DocEstado;
  ficheiro?: string;
}

interface PerfilData {
  nome: string;
  tipo: string;
  especialidade: string;
  subEspecialidade: string;
  anosExperiencia: number;
  numeroOrdem: string;
  numeroSinome: string;
  provincia: string;
  bio: string;
  rating: number;
  totalAvaliacoes: number;
  totalPlantoes: number;
  verified: boolean;
  saldoCarteira: number;
  disponivelAgora: boolean;
}

export default function PerfilMedico() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSave, setErroSave] = useState("");

  // Campos editáveis
  const [bio, setBio] = useState("");
  const [subEsp, setSubEsp] = useState("");
  const [anos, setAnos] = useState("");

  const [docs, setDocs] = useState<Documento[]>([
    { label: "Cédula da Ordem dos Médicos", estado: "NAO_ENVIADO" },
    { label: "Bilhete de Identidade", estado: "NAO_ENVIADO" },
    { label: "Licenciatura em Medicina", estado: "NAO_ENVIADO" },
    { label: "Carteira Profissional", estado: "NAO_ENVIADO" },
    { label: "Certificado de Especialidade (opcional)", estado: "NAO_ENVIADO" },
  ]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/medico/perfil")
      .then((r) => r.json())
      .then((data: PerfilData) => {
        setPerfil(data);
        setBio(data.bio ?? "");
        setSubEsp(data.subEspecialidade ?? "");
        setAnos(data.anosExperiencia ? String(data.anosExperiencia) : "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpload = (index: number, file: File | undefined) => {
    if (!file) return;
    setDocs((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, ficheiro: file.name, estado: "PENDENTE" } : d
      )
    );
  };

  async function toggleDisponivel() {
    if (!perfil) return;
    const next = !perfil.disponivelAgora;
    setPerfil((p) => p ? { ...p, disponivelAgora: next } : p);
    await fetch("/api/medico/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponivelAgora: next }),
    });
  }

  async function salvarEdicao() {
    setSalvando(true);
    setErroSave("");
    const res = await fetch("/api/medico/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, subEspecialidade: subEsp, anosExperiencia: anos }),
    });
    setSalvando(false);
    if (res.ok) {
      setPerfil((p) =>
        p ? { ...p, bio, subEspecialidade: subEsp, anosExperiencia: parseInt(anos) || 0 } : p
      );
      setEditando(false);
    } else {
      setErroSave("Erro ao guardar. Tente novamente.");
    }
  }

  const estadoConfig: Record<DocEstado, { cls: string; icon: React.ReactNode; label: string }> = {
    APROVADO:    { cls: "text-green-500",  icon: <CheckCircle size={15} strokeWidth={2} />, label: "Verificado" },
    PENDENTE:    { cls: "text-yellow-500", icon: <Clock size={15} strokeWidth={2} />,       label: "Em análise" },
    NAO_ENVIADO: { cls: "text-gray-300",   icon: <Paperclip size={15} strokeWidth={2} />,   label: "Não enviado" },
  };

  if (loading) {
    return (
      <div>
        <TopBar titulo="O meu Perfil" back="/medico" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div>
        <TopBar titulo="O meu Perfil" back="/medico" />
        <p className="text-center text-gray-400 py-20">Erro ao carregar perfil.</p>
      </div>
    );
  }

  const iniciais = perfil.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pb-28">
      <TopBar titulo="O meu Perfil" back="/medico" />

      {/* Hero / cabeçalho do perfil */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#1a5fba] px-5 pt-7 pb-10">
        <div className="flex items-start justify-between">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-black text-white shadow-lg">
              {iniciais}
            </div>
            {perfil.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center border-2 border-white">
                <BadgeCheck size={12} strokeWidth={2.5} className="text-white" />
              </div>
            )}
          </div>

          {/* Botão editar / salvar */}
          <div className="flex gap-2">
            {editando ? (
              <>
                <button
                  onClick={() => { setEditando(false); setErroSave(""); }}
                  className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl"
                >
                  <X size={13} strokeWidth={2} /> Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  disabled={salvando}
                  className="flex items-center gap-1.5 bg-green-400 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60"
                >
                  <Save size={13} strokeWidth={2} /> {salvando ? "A guardar…" : "Guardar"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 bg-white/15 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/25 transition-colors"
              >
                <Pencil size={13} strokeWidth={2} /> Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Nome e detalhes */}
        <div className="mt-4">
          <h1 className="text-xl font-bold text-white">{perfil.nome}</h1>
          <p className="text-blue-200 text-sm mt-0.5">
            {perfil.especialidade}
            {perfil.subEspecialidade && ` · ${perfil.subEspecialidade}`}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            {perfil.verified && (
              <span className="inline-flex items-center gap-1 bg-green-400/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
                <BadgeCheck size={11} strokeWidth={2.5} /> VERIFICADO
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-yellow-300 text-xs font-semibold">
              <Star size={12} strokeWidth={1.75} className="fill-yellow-300" />
              {perfil.rating.toFixed(1)} ({perfil.totalAvaliacoes})
            </span>
            <span className="inline-flex items-center gap-1 text-blue-200 text-xs">
              <MapPin size={11} strokeWidth={1.75} /> {perfil.provincia}
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas em cards sobrepostos ao hero */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl border border-gray-100 shadow-md grid grid-cols-3 divide-x divide-gray-100 mb-4">
        {[
          { label: "Plantões", value: perfil.totalPlantoes },
          { label: "Avaliações", value: perfil.totalAvaliacoes },
          { label: "Saldo (AOA)", value: perfil.saldoCarteira >= 1000 ? (perfil.saldoCarteira / 1000).toFixed(0) + "k" : perfil.saldoCarteira },
        ].map((s) => (
          <div key={s.label} className="text-center py-4">
            <p className="text-xl font-black text-[#0B3C74]">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toggle disponibilidade */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Disponível agora</p>
          <p className="text-xs text-gray-400 mt-0.5">Visível para clínicas que procuram plantões urgentes</p>
        </div>
        <button onClick={toggleDisponivel} className="shrink-0">
          {perfil.disponivelAgora
            ? <ToggleRight size={36} strokeWidth={1.5} className="text-green-500" />
            : <ToggleLeft size={36} strokeWidth={1.5} className="text-gray-300" />
          }
        </button>
      </div>

      {/* Informações profissionais */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informações Profissionais</h3>

        {editando ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Sub-especialidade</label>
              <input
                value={subEsp}
                onChange={(e) => setSubEsp(e.target.value)}
                placeholder="Ex: Cardiologia Intervencionista"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Anos de experiência</label>
              <input
                type="number"
                min="0"
                max="60"
                value={anos}
                onChange={(e) => setAnos(e.target.value)}
                placeholder="Ex: 5"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Biografia profissional</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Descreva a sua experiência, áreas de interesse e abordagem clínica…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors resize-none"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{bio.length}/500</p>
            </div>
            {erroSave && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{erroSave}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700">
            {perfil.numeroOrdem && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nº Ordem</p>
                  <p className="font-mono text-gray-900 font-semibold">{perfil.numeroOrdem}</p>
                </div>
              </div>
            )}
            {perfil.numeroSinome && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Carteira Profissional (SINOME)</p>
                  <p className="font-mono text-gray-900 font-semibold">{perfil.numeroSinome}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <Stethoscope size={14} strokeWidth={1.75} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Especialidade</p>
                <p className="text-gray-900 font-semibold">
                  {perfil.especialidade}
                  {perfil.subEspecialidade && <span className="text-gray-500 font-normal"> · {perfil.subEspecialidade}</span>}
                </p>
              </div>
            </div>
            {perfil.anosExperiencia > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <Award size={14} strokeWidth={1.75} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Experiência</p>
                  <p className="text-gray-900 font-semibold">{perfil.anosExperiencia} {perfil.anosExperiencia === 1 ? "ano" : "anos"}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={14} strokeWidth={1.75} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Localização</p>
                <p className="text-gray-900 font-semibold">{perfil.provincia}</p>
              </div>
            </div>
            {perfil.bio && (
              <p className="text-gray-600 leading-6 text-sm bg-gray-50 rounded-xl px-3 py-3 mt-2">
                {perfil.bio}
              </p>
            )}
            {!perfil.bio && (
              <button
                onClick={() => setEditando(true)}
                className="text-xs text-[#0B3C74] font-semibold flex items-center gap-1 mt-1"
              >
                <Pencil size={11} strokeWidth={2} /> Adicionar biografia profissional
              </button>
            )}
          </div>
        )}
      </div>

      {/* Verificação Express */}
      {!perfil.verified && (
        <div className="mx-4 mb-3 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Lock size={22} strokeWidth={1.75} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Perfil não verificado</p>
              <p className="text-xs text-orange-600 mt-1 leading-5">
                A Verificação Express desbloqueia candidaturas a plantões e aumenta a sua taxa de aceitação.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-orange-700">
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Confirmação da Carteira Profissional / Ordem</p>
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

      {/* Documentos */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documentos</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {docs.filter((d) => d.estado === "APROVADO").length}/{docs.length} verificados
          </span>
        </div>
        <div className="space-y-3">
          {docs.map((doc, i) => {
            const cfg = estadoConfig[doc.estado];
            return (
              <div key={doc.label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className={`shrink-0 ${cfg.cls}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">{doc.label}</p>
                  {doc.ficheiro ? (
                    <p className="text-xs text-gray-400 font-mono truncate">{doc.ficheiro}</p>
                  ) : (
                    <p className="text-xs text-gray-300">Nenhum ficheiro enviado</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
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
                      className="text-xs text-[#0B3C74] font-semibold border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-lg"
                    >
                      {doc.estado === "NAO_ENVIADO" ? "Carregar" : "Substituir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-300 mt-3 text-center">Formatos aceites: PDF, JPG, PNG · Máx. 10 MB por ficheiro</p>
      </div>

      {/* Acções de conta */}
      <div className="mx-4 mb-6 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <form action={logoutAction}>
          <button type="submit" className="w-full text-center text-red-500 font-semibold py-4 text-sm hover:bg-red-50 transition-colors">
            Terminar Sessão
          </button>
        </form>
      </div>
    </div>
  );
}

