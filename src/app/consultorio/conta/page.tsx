"use client";
import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import { logoutAction } from "@/app/actions/auth";
import {
  Building2, MapPin, Phone, Pencil, X, Save,
  DoorOpen, Wallet, ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface ConsultorioData {
  id: string;
  nome: string;
  morada: string | null;
  bairro: string | null;
  zonaLuanda: string | null;
  contacto: string | null;
  cidade: string | null;
  descricao: string | null;
  user: { email: string };
}

export default function ConsultorioContaPage() {
  const [consultorio, setConsultorio] = useState<ConsultorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSave, setErroSave] = useState("");

  const [nome, setNome] = useState("");
  const [morada, setMorada] = useState("");
  const [zonaLuanda, setZonaLuanda] = useState("");
  const [contacto, setContacto] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    fetch("/api/consultorio/perfil")
      .then((r) => r.json())
      .then((data: ConsultorioData) => {
        setConsultorio(data);
        setNome(data.nome ?? "");
        setMorada(data.morada ?? "");
        setZonaLuanda(data.zonaLuanda ?? "");
        setContacto(data.contacto ?? "");
        setDescricao(data.descricao ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function salvarEdicao() {
    setSalvando(true);
    setErroSave("");
    const res = await fetch("/api/consultorio/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, morada, zonaLuanda, contacto, descricao }),
    });
    setSalvando(false);
    if (res.ok) {
      setConsultorio((c) => c ? { ...c, nome, morada, zonaLuanda, contacto, descricao } : c);
      setEditando(false);
    } else {
      setErroSave("Erro ao guardar. Tente novamente.");
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar titulo="A minha Conta" back="/consultorio" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#00A99D] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!consultorio) {
    return (
      <div>
        <TopBar titulo="A minha Conta" back="/consultorio" />
        <p className="text-center text-gray-400 py-20">Erro ao carregar perfil.</p>
      </div>
    );
  }

  const inicial = consultorio.nome.trim().charAt(0).toUpperCase();
  const localizacao = [consultorio.zonaLuanda, consultorio.cidade].filter(Boolean).join(", ");

  return (
    <div className="pb-28">
      <TopBar titulo="A minha Conta" back="/consultorio" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#007a72] to-[#00A99D] px-5 pt-7 pb-10">
        <div className="flex items-start justify-between">
          <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-black text-white shadow-lg">
            {inicial}
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
                  className="flex items-center gap-1.5 bg-white text-[#007a72] text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-60"
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
          <h1 className="text-xl font-bold text-white">{consultorio.nome}</h1>
          {localizacao && <p className="text-teal-100 text-sm mt-0.5">{localizacao}, Luanda</p>}
          <p className="text-teal-200 text-xs mt-1">{consultorio.user.email}</p>
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl border border-gray-100 shadow-md grid grid-cols-2 divide-x divide-gray-100 mb-4">
        <Link href="/consultorio/salas" className="flex flex-col items-center py-4 gap-1">
          <DoorOpen size={20} strokeWidth={1.5} className="text-[#00A99D]" />
          <p className="text-xs font-semibold text-gray-700 mt-0.5">As minhas salas</p>
          <p className="text-[10px] text-gray-400">Gerir salas</p>
        </Link>
        <Link href="/consultorio/faturacao" className="flex flex-col items-center py-4 gap-1">
          <Wallet size={20} strokeWidth={1.5} className="text-[#00A99D]" />
          <p className="text-xs font-semibold text-gray-700 mt-0.5">Faturação</p>
          <p className="text-[10px] text-gray-400">Ver ganhos</p>
        </Link>
      </div>

      {/* Informações / Edição */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informações do Consultório</h3>

        {editando ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Nome do Consultório</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Zona de Luanda</label>
              <input
                value={zonaLuanda}
                onChange={(e) => setZonaLuanda(e.target.value)}
                placeholder="Ex: Talatona, Kilamba, Miramar…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Morada</label>
              <input
                value={morada}
                onChange={(e) => setMorada(e.target.value)}
                placeholder="Ex: Rua da Missão, nº 10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Contacto</label>
              <input
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ex: +244 9XX XXX XXX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="Descreva as especialidades e serviços do consultório…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00A99D] transition-colors resize-none"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{descricao.length}/400</p>
            </div>
            {erroSave && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{erroSave}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700">
            {consultorio.zonaLuanda && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={14} strokeWidth={1.75} className="text-[#00A99D]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Zona</p>
                  <p className="text-gray-900 font-semibold">{consultorio.zonaLuanda}, Luanda</p>
                </div>
              </div>
            )}
            {consultorio.morada && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={14} strokeWidth={1.75} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Morada</p>
                  <p className="text-gray-900 font-semibold">{consultorio.morada}</p>
                </div>
              </div>
            )}
            {consultorio.contacto && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={14} strokeWidth={1.75} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Contacto</p>
                  <p className="text-gray-900 font-semibold">{consultorio.contacto}</p>
                </div>
              </div>
            )}
            {consultorio.descricao && (
              <p className="text-gray-600 leading-6 text-sm bg-gray-50 rounded-xl px-3 py-3 mt-1">
                {consultorio.descricao}
              </p>
            )}
            {!consultorio.descricao && !consultorio.morada && !consultorio.contacto && (
              <button
                onClick={() => setEditando(true)}
                className="text-xs text-[#00A99D] font-semibold flex items-center gap-1 mt-1"
              >
                <Pencil size={11} strokeWidth={2} /> Completar informações do consultório
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navegação rápida */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        <Link href="/consultorio/salas" className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
              <DoorOpen size={15} strokeWidth={1.75} className="text-[#00A99D]" />
            </div>
            <span className="text-sm font-medium text-gray-700">As minhas salas</span>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} className="text-gray-300" />
        </Link>
        <Link href="/consultorio/faturacao" className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <Wallet size={15} strokeWidth={1.75} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Faturação e ganhos</span>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} className="text-gray-300" />
        </Link>
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

