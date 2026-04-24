"use client";
import { useState, use } from "react";
import { salasMock } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";

export default function AvaliarSala({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sala = salasMock.find((s) => s.id === id);
  const router = useRouter();

  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (!sala) return notFound();

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-4xl">⭐</div>
        <h2 className="text-xl font-bold text-gray-900">Avaliação Enviada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          Obrigado pelo seu feedback sobre a sala. Ajuda outros profissionais a escolher bem.
        </p>
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`text-2xl ${s <= nota ? "text-yellow-400" : "text-gray-200"}`}>★</span>
          ))}
        </div>
        <button
          onClick={() => router.push("/medico/minhas-reservas")}
          className="mt-8 bg-brand-500 text-white font-bold px-8 py-3 rounded-2xl w-full max-w-xs"
        >
          Ver minhas reservas
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Avaliar Sala" back="/medico/minhas-reservas" />

      <div className="px-4 py-6 space-y-6">
        {/* Info da sala */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sala Reservada</p>
          <p className="font-semibold text-gray-900">{sala.clinica.nome} — {sala.nome}</p>
          <p className="text-sm text-gray-500 mt-0.5">📍 {sala.zona}</p>
        </div>

        {/* Estrelas */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-700 text-center mb-1">Como avalia este espaço?</p>
          <p className="text-xs text-gray-400 text-center mb-5">Toque numa estrela para avaliar</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setNota(s)}
                className="text-4xl transition-transform hover:scale-110 active:scale-95"
              >
                <span className={(hover || nota) >= s ? "text-yellow-400" : "text-gray-200"}>★</span>
              </button>
            ))}
          </div>
          {nota > 0 && (
            <p className="text-center text-sm font-semibold text-yellow-600 mt-3">
              {["", "Muito mau", "Mau", "Razoável", "Bom", "Excelente!"][nota]}
            </p>
          )}
        </div>

        {/* Tags */}
        {nota > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">O que avaliou bem?</p>
            <div className="flex flex-wrap gap-2">
              {["Limpeza", "Equipamento", "Climatização", "Privacidade", "Estacionamento", "Localização"].map((tag) => {
                const selecionado = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selecionado ? "bg-brand-500 text-white border-brand-500" : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comentário */}
        {nota > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Comentário (opcional)</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              placeholder="Descreva a sua experiência nesta sala..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        )}

        <button
          disabled={nota === 0}
          onClick={() => setDone(true)}
          className="w-full bg-brand-500 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Enviar Avaliação
        </button>
        <button onClick={() => router.back()} className="w-full text-gray-400 text-sm py-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}
