"use client";
import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import { logoutAction } from "@/app/actions/auth";
import {
  BadgeCheck, Star, Building2, MapPin, Phone, Globe,
  CheckCircle, Pencil, X, Save, ChevronRight, Lock, Check,
} from "lucide-react";

interface ClinicaData {
  id: string;
  nome: string;
  morada: string;
  bairro: string;
  cidade: string;
  provincia: string;
  zonaLuanda: string;
  contacto: string;
  website: string;
  descricao: string;
  logo: string;
  rating: number;
  totalAvaliacoes: number;
  verified: boolean;
}

export default function ContaClinica() {
  const [clinica, setClinica] = useState<ClinicaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSave, setErroSave] = useState("");

  const [morada, setMorada] = useState("");
  const [contacto, setContacto] = useState("");
  const [website, setWebsite] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    fetch("/api/clinica/perfil")
      .then((r) => r.json())
      .then((data: ClinicaData) => {
        setClinica(data);
        setMorada(data.morada ?? "");
        setContacto(data.contacto ?? "");
        setWebsite(data.website ?? "");
        setDescricao(data.descricao ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function salvarEdicao() {
    setSalvando(true);
    setErroSave("");
    const res = await fetch("/api/clinica/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ morada, contacto, website, descricao }),
    });
    setSalvando(false);
    if (res.ok) {
      setClinica((c) => c ? { ...c, morada, contacto, website, descricao } : c);
      setEditando(false);
    } else {
      setErroSave("Erro ao guardar. Tente novamente.");
    }
  }

  const docs = [
    { label: "Alvará de Funcionamento", estado: "APROVADO" as const },
    { label: "Licença do MINSA", estado: "APROVADO" as const },
    { label: "NIF da Clínica", estado: "APROVADO" as const },
  ];

  if (loading) {
    return (
      <div>
        <TopBar titulo="A minha Conta" back="/clinica" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div>
        <TopBar titulo="A minha Conta" back="/clinica" />
        <p className="text-center text-gray-400 py-20">Erro ao carregar perfil.</p>
      </div>
    );
  }

  const inicial = clinica.nome.trim().charAt(0).toUpperCase();
  const localizacao = [clinica.zonaLuanda, clinica.cidade, clinica.provincia].filter(Boolean).join(", ");

  return (
    <div className="pb-28">
      <TopBar titulo="A minha Conta" back="/clinica" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#1a5fba] px-5 pt-7 pb-10">
        <div className="flex items-start justify-between">
          {/* Logo / inicial */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-black text-white shadow-lg">
              {inicial}
            </div>
            {clinica.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center border-2 border-white">
                <BadgeCheck size={12} strokeWidth={2.5} className="text-white" />
              </div>
            )}
          </div>

          {/* Botão editar */}
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

        <div className="mt-4">
          <h1 className="text-xl font-bold text-white">{clinica.nome}</h1>
          {localizacao && <p className="text-blue-200 text-sm mt-0.5">{localizacao}</p>}
          <div className="flex items-center gap-3 mt-2.5">
            {clinica.verified && (
              <span className="inline-flex items-center gap-1 bg-green-400/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
                <BadgeCheck size={11} strokeWidth={2.5} /> VERIFICADA
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-yellow-300 text-xs font-semibold">
              <Star size={12} strokeWidth={1.75} className="fill-yellow-300" />
              {clinica.rating.toFixed(1)} ({clinica.totalAvaliacoes})
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl border border-gray-100 shadow-md grid grid-cols-2 divide-x divide-gray-100 mb-4">
        <div className="text-center py-4">
          <p className="text-xl font-black text-[#0B3C74]">{clinica.rating.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Rating médio</p>
        </div>
        <div className="text-center py-4">
          <p className="text-xl font-black text-[#0B3C74]">{clinica.totalAvaliacoes}</p>
          <p className="text-xs text-gray-400 mt-0.5">Avaliações</p>
        </div>
      </div>

      {/* Informações / Edição */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informações da Clínica</h3>

        {editando ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Morada</label>
              <input
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                placeholder="Ex: Rua da Missão, nº 10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Contacto</label>
              <input
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ex: +244 9XX XXX XXX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ex: https://clinica.ao"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="Descreva os serviços e especialidades da clínica…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors resize-none"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{descricao.length}/400</p>
            </div>
            {erroSave && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{erroSave}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700">
            {clinica.morada && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Morada</p>
                  <p className="text-gray-900 font-semibold">{clinica.morada}</p>
                </div>
              </div>
            )}
            {clinica.contacto && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={14} strokeWidth={1.75} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Contacto</p>
                  <p className="text-gray-900 font-semibold">{clinica.contacto}</p>
                </div>
              </div>
            )}
            {clinica.website && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <Globe size={14} strokeWidth={1.75} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Website</p>
                  <p className="text-[#0B3C74] font-semibold">{clinica.website}</p>
                </div>
              </div>
            )}
            {clinica.descricao && (
              <p className="text-gray-600 leading-6 text-sm bg-gray-50 rounded-xl px-3 py-3 mt-1">
                {clinica.descricao}
              </p>
            )}
            {!clinica.descricao && (
              <button
                onClick={() => setEditando(true)}
                className="text-xs text-[#0B3C74] font-semibold flex items-center gap-1 mt-1"
              >
                <Pencil size={11} strokeWidth={2} /> Adicionar descrição da clínica
              </button>
            )}
          </div>
        )}
      </div>

      {/* Verificação */}
      {!clinica.verified && (
        <div className="mx-4 mb-3 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Lock size={22} strokeWidth={1.75} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Clínica não verificada</p>
              <p className="text-xs text-orange-600 mt-1 leading-5">
                Verifique a sua clínica para publicar plantões e ganhar a confiança dos profissionais.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-orange-700">
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Alvará de Funcionamento</p>
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> Licença do MINSA</p>
                <p className="inline-flex items-center gap-1"><Check size={13} strokeWidth={2} /> NIF da Clínica</p>
              </div>
              <button className="mt-3 w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm inline-flex items-center justify-center gap-1">
                Iniciar Verificação <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentos */}
      {clinica.verified && (
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Documentos Verificados</h3>
          <div className="space-y-2.5">
            {docs.map((d) => (
              <div key={d.label} className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
                <CheckCircle size={15} strokeWidth={2} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-800 font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plano */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Plano Actual</h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#0B3C74]">Plano Gratuito</p>
            <p className="text-xs text-gray-500 mt-0.5">Comissão de 10% por plantão</p>
          </div>
          <button className="bg-[#0B3C74] text-white text-xs font-bold px-4 py-2 rounded-xl">
            UPGRADE
          </button>
        </div>
      </div>

      {/* Logout */}
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

