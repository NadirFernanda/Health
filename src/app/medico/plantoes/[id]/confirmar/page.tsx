"use client";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Lock, CheckCircle, Building2, Calendar, Clock, Stethoscope, Banknote, Info, ChevronRight, Ban } from "lucide-react";

type PlantaoInfo = {
  id: string; especialidade: string; dataInicio: string; dataFim: string;
  valorKwanzas: number;
  publicadoPorMedico: boolean;
  profissionalPublicadorId: string | null;
  clinica: { nome: string } | null;
  profissionalPublicador: { nome: string } | null;
};

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatData(s: string) {
  return new Date(s).toLocaleDateString("pt-AO", { weekday: "long", day: "2-digit", month: "long" });
}
function formatHora(s: string) {
  return new Date(s).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

export default function ConfirmarCandidatura({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [plantao, setPlantao] = useState<PlantaoInfo | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/plantoes/${id}`).then((r) => r.json()).then((d) => { if (d.id) setPlantao(d); });
    fetch("/api/medico/perfil").then((r) => r.json()).then((d) => {
      if (typeof d.verified === "boolean") setVerified(d.verified);
      if (d.id) setPerfilId(d.id);
    });
  }, [id]);

  const handleCandidatar = async () => {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/medico/candidaturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantaoId: id }),
    });
    setLoading(false);
    if (res.ok) {
      setEnviado(true);
    } else {
      const d = await res.json();
      setErro(d.error ?? "Erro ao enviar candidatura.");
    }
  };

  if (!plantao) return <div className="p-8 text-center text-gray-400">A carregar...</div>;

  // Bloquear auto-candidatura
  if (perfilId && plantao.profissionalPublicadorId === perfilId) {
    return (
      <div>
        <TopBar titulo="Candidatura" back={`/medico/plantoes/${id}`} />
        <div className="px-4 py-10 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Ban size={36} strokeWidth={1.5} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Não permitido</h2>
          <p className="text-gray-500 text-sm leading-6 max-w-sm">
            Não podes candidatar-te ao teu próprio plantão. Esta vaga foi publicada por ti para encontrar um substituto.
          </p>
          <button onClick={() => router.back()} className="mt-4 bg-gray-100 text-gray-700 font-semibold px-8 py-3 rounded-2xl">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Verificação Express — bloquear se não verificado
  if (verified === false) {
    return (
      <div>
        <TopBar titulo="Candidatura" back={`/medico/plantoes/${id}`} />
        <div className="px-4 py-10 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={36} strokeWidth={1.5} className="text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verificação Necessária</h2>
          <p className="text-gray-500 text-sm leading-6 max-w-sm">
            Para se candidatar a plantões precisa de completar a Verificação Express.
            Garante a confiança das clínicas no seu perfil.
          </p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 w-full text-left space-y-2">
            <p className="text-sm font-bold text-orange-700 flex items-center gap-1"><CheckCircle size={14} strokeWidth={2} /> O que inclui a Verificação Express</p>
            <ul className="text-xs text-orange-600 space-y-1">
              <li>• Confirmação do número de ordem/SINOME</li>
              <li>• Validação de identidade (BI/Passaporte)</li>
              <li>• Verificação de credenciais clínicas</li>
              <li>• Prazo: 24–48h úteis</li>
            </ul>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 w-full">
            <p className="text-xs text-[#0B3C74] font-bold mb-1">Taxa de verificação única</p>
            <p className="text-3xl font-bold text-[#0B3C74]">2.500 AOA</p>
            <p className="text-xs text-gray-400 mt-1">Pagamento via Multicaixa Express</p>
          </div>
          <Link
            href="/medico/perfil"
            className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-center inline-flex items-center justify-center gap-1"
          >
            Iniciar Verificação Express <ChevronRight size={16} strokeWidth={2} />
          </Link>
          <button onClick={() => router.back()} className="text-gray-400 text-sm py-2">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} strokeWidth={1.5} className="text-green-500" />
          </div>
        <h2 className="text-xl font-bold text-gray-900">Candidatura enviada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          A clínica irá analisar o seu perfil e notificaremos quando houver resposta.
        </p>
        <button
          onClick={() => router.push("/medico")}
          className="mt-6 bg-[#0B3C74] text-white font-bold px-8 py-3 rounded-2xl"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Confirmar Candidatura" back={`/medico/plantoes/${id}`} />
      <div className="px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Resumo</p>
          <div className="text-sm space-y-1.5 text-gray-700">
          <p>&#x200B;<Building2 size={14} strokeWidth={1.75} className="inline mr-1 text-gray-400" /><span className="font-semibold">{plantao.clinica?.nome ?? plantao.profissionalPublicador?.nome ?? "Médico"}</span></p>
            <p><Calendar size={14} strokeWidth={1.75} className="inline mr-1 text-gray-400" />{formatData(plantao.dataInicio)}</p>
            <p><Clock size={14} strokeWidth={1.75} className="inline mr-1 text-gray-400" />{formatHora(plantao.dataInicio)} – {formatHora(plantao.dataFim)}</p>
            <p><Stethoscope size={14} strokeWidth={1.75} className="inline mr-1 text-gray-400" />{plantao.especialidade}</p>
            <p><Banknote size={14} strokeWidth={1.75} className="inline mr-1 text-gray-400" /><span className="font-bold text-[#0B3C74] text-base">{formatAOA(plantao.valorKwanzas)}</span></p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="flex items-center gap-1 text-sm text-[#0B3C74] font-semibold"><Info size={14} strokeWidth={2} /> Como funciona</p>
          <ul className="text-xs text-blue-700 mt-2 space-y-1.5">
            <li>• A clínica recebe a sua candidatura e analisa o seu perfil</li>
            <li>• Receberá uma notificação com a resposta em até 24h</li>
            <li>• Se aceite, o pagamento é processado pela clínica antes do plantão</li>
            <li>• O valor é creditado na sua carteira após a conclusão</li>
          </ul>
        </div>

        {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

        <button
          onClick={handleCandidatar}
          disabled={loading}
          className="w-full bg-[#0B3C74] hover:bg-[#00A99D] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base"
        >
          {loading ? "A enviar..." : "CONFIRMAR CANDIDATURA"}
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
