"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/nav";
import { Star, BadgeCheck, MapPin, Briefcase, Award, MessageCircle } from "lucide-react";

type Credencial = { tipo: string; comentario: string | null; estado: string; criadoEm: string };
type Avaliacao  = { estrelas: number; comentario: string | null; criadoEm: string };
type Medico = {
  id: string; nome: string; tipo: string; especialidade: string;
  subEspecialidade: string | null; provincia: string; cidade: string | null;
  bairro: string | null; foto: string | null; bio: string | null;
  rating: number; totalAvaliacoes: number; totalPlantoes: number;
  verified: boolean; verificadoEm: string | null; anosExperiencia: number | null;
  disponivelAgora: boolean; numeroOrdem: string | null;
  credenciais: Credencial[]; avaliacoesRecebidas: Avaliacao[];
};

function Stars({ nota }: { nota: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} strokeWidth={1.75}
          className={i < Math.round(nota) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </span>
  );
}

export default function PerfilMedicoClinica() {
  const { id } = useParams<{ id: string }>();
  const [medico, setMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clinica/medicos/${id}`, { credentials: "include" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
        return body as Medico;
      })
      .then(setMedico)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div>
      <TopBar titulo="Perfil do Médico" back="/clinica/medicos" />
      <div className="flex justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !medico) return (
    <div>
      <TopBar titulo="Perfil do Médico" back="/clinica/medicos" />
      <div className="px-4 pt-6 text-center text-sm text-red-500">{error ?? "Médico não encontrado"}</div>
    </div>
  );

  const iniciais = medico.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pb-28">
      <TopBar titulo="Perfil do Médico" back="-1" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-8 pb-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
            {medico.foto
              ? <img src={medico.foto} alt={medico.nome} className="w-full h-full object-cover" />
              : iniciais}
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-white font-bold text-xl">{medico.nome}</h1>
              {medico.verified && <BadgeCheck size={18} strokeWidth={2} className="text-[#7fffd4]" />}
            </div>
            <p className="text-blue-200 text-sm mt-0.5">{medico.especialidade}{medico.subEspecialidade ? ` · ${medico.subEspecialidade}` : ""}</p>
            {(medico.cidade || medico.provincia) && (
              <p className="text-blue-300 text-xs mt-1 flex items-center justify-center gap-1">
                <MapPin size={11} strokeWidth={1.75} />
                {medico.cidade ? `${medico.cidade}, ` : ""}{medico.provincia}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-1">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{medico.rating.toFixed(1)}</p>
              <Stars nota={medico.rating} />
              <p className="text-blue-300 text-[10px] mt-0.5">{medico.totalAvaliacoes} aval.</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">{medico.totalPlantoes}</p>
              <p className="text-blue-300 text-[10px]">Plantões</p>
            </div>
            {medico.anosExperiencia && (
              <>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{medico.anosExperiencia}</p>
                  <p className="text-blue-300 text-[10px]">Anos exp.</p>
                </div>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap justify-center">
            {medico.verified && (
              <span className="bg-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <BadgeCheck size={11} strokeWidth={2} /> Perfil Verificado
              </span>
            )}
            {medico.disponivelAgora && (
              <span className="bg-green-400/30 text-green-200 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Disponível Agora
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Bio */}
        {medico.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sobre</p>
            <p className="text-sm text-gray-700 leading-relaxed">{medico.bio}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Informações</p>
          {medico.numeroOrdem && (
            <div className="flex items-center gap-2 text-sm">
              <Award size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">Nº Ordem:</span>
              <span className="font-semibold text-gray-800">{medico.numeroOrdem}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Briefcase size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
            <span className="text-gray-500">Tipo:</span>
            <span className="font-semibold text-gray-800">{medico.tipo}</span>
          </div>
          {medico.verificadoEm && (
            <div className="flex items-center gap-2 text-sm">
              <BadgeCheck size={14} strokeWidth={1.75} className="text-[#00A99D] shrink-0" />
              <span className="text-gray-500">Verificado em:</span>
              <span className="font-semibold text-gray-800">
                {new Date(medico.verificadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>

        {/* Credenciais */}
        {medico.credenciais.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Credenciais Verificadas</p>
            <div className="space-y-2">
              {medico.credenciais.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.tipo}</p>
                    {c.comentario && <p className="text-xs text-gray-500">{c.comentario}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações */}
        {medico.avaliacoesRecebidas.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MessageCircle size={12} /> Avaliações recentes
            </p>
            <div className="space-y-3">
              {medico.avaliacoesRecebidas.map((a, i) => (
                <div key={i} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <Stars nota={a.estrelas} />
                    <p className="text-[10px] text-gray-300">
                      {new Date(a.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {a.comentario && <p className="text-xs text-gray-600 italic">&ldquo;{a.comentario}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
