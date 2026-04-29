"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";
import { Bell, User, BadgeCheck } from "lucide-react";

type Perfil = { nome: string; verified: boolean; disponivelAgora: boolean; saldoCarteira: number };
type PlantaoAPI = {
  id: string; tipoProfissional: string; especialidade: string; dataInicio: string; dataFim: string;
  valorKwanzas: number; vagas: number; vagasPreenchidas: number; estado: string;
  descricao: string; clinica: { id: string; nome: string; morada: string; cidade: string; provincia: string; logo: string; rating: number; totalAvaliacoes: number; verified: boolean };
  equipamentos: Record<string, boolean>;
};
type Candidatura = { id: string; estado: string; plantao: { clinica: { nome: string } | null; profissionalPublicador?: { nome: string } | null } };

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default function MedicoDashboard() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [disponivel, setDisponivel] = useState(false);
  const [plantoes, setPlantoes] = useState<PlantaoAPI[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [ganhosMes, setGanhosMes] = useState(0);
  const [plantoesMes, setPlantoesMes] = useState(0);

  useEffect(() => {
    fetch("/api/medico/perfil").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.nome) { setPerfil(d); setDisponivel(d.disponivelAgora ?? false); }
    }).catch(() => {});
    fetch("/api/plantoes").then((r) => r.ok ? r.json() : []).then((d) => {
      if (Array.isArray(d)) setPlantoes(d.filter((p: PlantaoAPI) => p.estado === "ABERTO").slice(0, 5));
    }).catch(() => {});
    fetch("/api/medico/candidaturas").then((r) => r.ok ? r.json() : []).then((d) => {
      if (Array.isArray(d)) {
        setCandidaturas(d.slice(0, 5));
        setPlantoesMes(d.filter((c: Candidatura) => c.estado === "ACEITE").length);
      }
    }).catch(() => {});
    fetch("/api/medico/ganhos").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.transacoes) {
        const total = d.transacoes
          .filter((t: { tipo: string; estado: string }) => t.tipo === "CREDITO" && t.estado === "PROCESSADO")
          .reduce((s: number, t: { valorCentavos: string }) => s + Math.round(parseInt(t.valorCentavos) / 100), 0);
        setGanhosMes(total);
      }
    }).catch(() => {});
  }, []);

  const toggleDisponivel = async () => {
    const next = !disponivel;
    setDisponivel(next);
    await fetch("/api/medico/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponivelAgora: next }),
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-6">
        {/* Logo centrada no topo */}
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg shadow-black/20">
            <Image
              src="/Imagens/LOGO_MED_FREELA.png"
              alt="MedFreela"
              width={110}
              height={44}
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Olá,</p>
            <h1 className="text-white font-bold text-xl">{perfil?.nome ?? "..."}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/medico/notificacoes" className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Bell size={18} strokeWidth={1.75} />
            </Link>
            <Link href="/medico/perfil" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <User size={18} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
        {perfil?.verified && (
          <span className="inline-flex items-center gap-1 bg-[#00A99D]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <BadgeCheck size={13} strokeWidth={2} /> Perfil Verificado
          </span>
        )}

        {/* Toggle Disponível Agora */}
        <div className={`mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${disponivel ? "bg-green-500/30" : "bg-white/10"}`}>
          <div>
            <p className="text-white text-xs font-bold">Disponível Agora</p>
            <p className="text-blue-200 text-xs">{disponivel ? "Clínicas podem contactar-o directamente" : "Activate para receber turnos urgentes"}</p>
          </div>
          <button
            onClick={toggleDisponivel}
            className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${disponivel ? "bg-green-400" : "bg-white/30"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${disponivel ? "left-6" : "left-0.5"}`} />
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Plantões este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{plantoesMes}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Ganhos este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatAOA(ganhosMes)}</p>
          </div>
        </div>
      </div>

      {/* Candidaturas recentes */}
      {candidaturas.length > 0 && (
        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">As minhas candidaturas</h2>
            <Link href="/medico/buscar" className="text-xs text-[#0B3C74] font-semibold">Ver todas</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {candidaturas.map((c) => {
              const cor = c.estado === "ACEITE" ? "bg-green-50 text-green-700 border-green-200"
                : c.estado === "RECUSADO" ? "bg-red-50 text-red-600 border-red-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200";
              return (
                <div key={c.id} className={`shrink-0 border rounded-xl px-3 py-2 text-xs font-semibold ${cor}`}>
                  {c.plantao.clinica?.nome ?? c.plantao.profissionalPublicador?.nome ?? "Plantão"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acção rápida: publicar substituto */}
      <div className="px-4 pt-4 space-y-2">
        <Link href="/medico/publicar-plantao" className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-amber-800">Tens um plantão que não podes fazer?</p>
            <p className="text-xs text-amber-600 mt-0.5">Publica a vaga e paga um substituto →</p>
          </div>
        </Link>
        <Link href="/medico/plantoes" className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-blue-800">Os meus plantões publicados</p>
            <p className="text-xs text-blue-600 mt-0.5">Ver vagas que publicaste e as candidaturas →</p>
          </div>
        </Link>
        <Link href="/medico/minhas-reservas" className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-teal-800">Minhas Reservas de Salas</p>
            <p className="text-xs text-teal-600 mt-0.5">Ver e gerir as tuas reservas de consultórios →</p>
          </div>
        </Link>
      </div>

      {/* Plantões disponíveis */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões para si</h2>
          <Link href="/medico/buscar" className="text-xs text-[#0B3C74] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoes.map((p) => (
            <PlantaoCard key={p.id} plantao={p as never} showCandidatarBtn />
          ))}
        </div>
      </div>
    </div>
  );
}
