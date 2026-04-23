"use client";
import { plantoesMock, formatAOA, formatData, formatHora } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfirmarCandidatura({ params }: { params: { id: string } }) {
  const plantao = plantoesMock.find((p) => p.id === params.id);
  const router = useRouter();
  const [enviado, setEnviado] = useState(false);

  if (!plantao) return null;

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Candidatura enviada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          A clínica irá analisar o seu perfil e notificaremos quando houver resposta.
        </p>
        <button
          onClick={() => router.push("/medico")}
          className="mt-6 bg-[#1A6FBB] text-white font-bold px-8 py-3 rounded-2xl"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Confirmar Candidatura" back={`/medico/plantoes/${params.id}`} />
      <div className="px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Resumo</p>
          <div className="text-sm space-y-1.5 text-gray-700">
            <p>🏥 <span className="font-semibold">{plantao.clinica.nome}</span></p>
            <p>📅 {formatData(plantao.dataInicio)}</p>
            <p>⏰ {formatHora(plantao.dataInicio)} – {formatHora(plantao.dataFim)}</p>
            <p>🩺 {plantao.especialidade}</p>
            <p>💵 <span className="font-bold text-[#1A6FBB] text-base">{formatAOA(plantao.valorKwanzas)}</span></p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm text-[#1A6FBB] font-semibold">ℹ️ Como funciona</p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1.5">
            <li>• A clínica recebe a sua candidatura e analisa o seu perfil</li>
            <li>• Receberá uma notificação com a resposta em até 24h</li>
            <li>• Se aceite, o pagamento é processado pela clínica antes do plantão</li>
            <li>• O valor é creditado na sua carteira após a conclusão</li>
          </ul>
        </div>

        <button
          onClick={() => setEnviado(true)}
          className="w-full bg-[#1A6FBB] hover:bg-[#0D4F8A] text-white font-bold py-4 rounded-2xl transition-colors text-base"
        >
          CONFIRMAR CANDIDATURA
        </button>
        <button
          onClick={() => router.back()}
          className="w-full text-gray-500 text-sm font-medium py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
