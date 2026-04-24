"use client";
import { useState } from "react";
import { medicoLogado, plantoesMock, candidaturasMock, transacoesMock, formatAOA } from "@/lib/mock-data";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";

export default function MedicoDashboard() {
  const [disponivel, setDisponivel] = useState(false);
  const ganhosMes = transacoesMock
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PROCESSADO")
    .reduce((sum, t) => sum + t.valor, 0);
  const plantoesMes = candidaturasMock.filter((c) => c.estado === "ACEITE").length;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Olá 👋</p>
            <h1 className="text-white font-bold text-xl">{medicoLogado.nome}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/medico/notificacoes" className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">
              🔔
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">3</span>
            </Link>
            <Link href="/medico/perfil" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">👤</Link>
          </div>
        </div>
        {medicoLogado.verified && (
          <span className="inline-flex items-center gap-1 bg-[#27AE60]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            ✓ Perfil Verificado
          </span>
        )}

        {/* Toggle Disponível Agora */}
        <div className={`mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${disponivel ? "bg-green-500/30" : "bg-white/10"}`}>
          <div>
            <p className="text-white text-xs font-bold">Disponível Agora</p>
            <p className="text-blue-200 text-xs">{disponivel ? "🟢 Clínicas podem contactar-o directamente" : "Activate para receber turnos urgentes"}</p>
          </div>
          <button
            onClick={() => setDisponivel((v) => !v)}
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

      {/* Acesso rápido: Salas */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Space-as-a-Service</h2>
          <Link href="/medico/salas" className="text-xs text-[#1A6FBB] font-semibold">Ver salas</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/medico/salas" className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-2xl">🏥</span>
            <p className="text-sm font-bold text-purple-800">Reservar Sala</p>
            <p className="text-xs text-purple-500">Consultórios por hora em Luanda</p>
          </Link>
          <Link href="/medico/minhas-reservas" className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-bold text-brand-700">Minhas Reservas</p>
            <p className="text-xs text-brand-400">Ver e gerir reservas activas</p>
          </Link>
        </div>
      </div>

      {/* Candidaturas recentes */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">As minhas candidaturas</h2>
          <Link href="/medico/buscar" className="text-xs text-[#1A6FBB] font-semibold">Ver todas</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {candidaturasMock.map((c) => {
            const cor = c.estado === "ACEITE" ? "bg-green-50 text-green-700 border-green-200"
              : c.estado === "RECUSADO" ? "bg-red-50 text-red-600 border-red-200"
              : "bg-yellow-50 text-yellow-700 border-yellow-200";
            return (
              <div key={c.id} className={`shrink-0 border rounded-xl px-3 py-2 text-xs font-semibold ${cor}`}>
                {c.estado === "ACEITE" ? "✓" : c.estado === "RECUSADO" ? "✗" : "⏳"} {c.plantao.clinica.nome}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plantões disponíveis */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões para si</h2>
          <Link href="/medico/buscar" className="text-xs text-[#1A6FBB] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoesMock.filter(p => p.estado === "ABERTO").map((p) => (
            <PlantaoCard key={p.id} plantao={p} showCandidatarBtn />
          ))}
        </div>
      </div>
    </div>
  );
}
