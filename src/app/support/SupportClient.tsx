"use client";

import { useState } from "react";
import { CreateTicketForm } from "@/components/support-ticket-form";
import { TicketList } from "@/components/support-ticket-list";
import { HeadphonesIcon, Plus, X, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SupportClient() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTicketCreated() {
    setShowForm(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg shadow-black/20">
            <img
              src="/Imagens/LOGO_MED_FREELA.png"
              alt="MedFreela"
              className="object-contain h-11 w-auto"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Link href="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
            <ChevronLeft size={16} strokeWidth={2} />
          </Link>
          <div>
            <p className="text-blue-200 text-xs">Ajuda</p>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <HeadphonesIcon size={16} strokeWidth={1.75} />
              Centro de Suporte
            </h1>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-4 pb-10 space-y-4">
        {/* Botão novo ticket */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-colors ${
            showForm
              ? "bg-gray-200 text-gray-700"
              : "bg-[#00A99D] hover:bg-[#009082] text-white"
          }`}
        >
          {showForm ? <><X size={16} strokeWidth={2} /> Cancelar</> : <><Plus size={16} strokeWidth={2} /> Novo Ticket</>}
        </button>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Abrir novo ticket</h2>
            <CreateTicketForm onSuccess={handleTicketCreated} />
          </div>
        )}

        {/* Lista de tickets */}
        {!showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Os meus tickets</h2>
            <TicketList key={refreshKey} />
          </div>
        )}

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Tempos de resposta</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-blue-800">
              <span>Urgente</span><span className="font-semibold">{'< 2 horas'}</span>
            </div>
            <div className="flex justify-between text-xs text-blue-800">
              <span>Alta</span><span className="font-semibold">{'< 4 horas'}</span>
            </div>
            <div className="flex justify-between text-xs text-blue-800">
              <span>Normal</span><span className="font-semibold">{'< 24 horas'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
