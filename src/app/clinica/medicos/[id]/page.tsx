"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/nav";
import {
  Star, BadgeCheck, MapPin, Briefcase, Award, MessageCircle,
  Clock, Stethoscope, Hash, Calendar,
} from "lucide-react";

type Credencial = { tipo: string; comentario: string | null; estado: string; criadoEm: string };
type Avaliacao  = { estrelas: number; comentario: string | null; criadoEm: string };
type Medico = {
  id: string; nome: string; tipo: string; especialidade: string;
  subEspecialidade: string | null; provincia: string; cidade: string | null;
  bairro: string | null; foto: string | null; bio: string | null;
  rating: number; totalAvaliacoes: number; totalPlantoes: number;
  verified: boolean; verificadoEm: string | null; anosExperiencia: number | null;
  disponivelAgora: boolean; numeroOrdem: string | null;
  numeroSinome: string | null; numeroOma: string | null;
  credenciais: Credencial[]; avaliacoesRecebidas: Avaliacao[];
};

function Stars({ nota, size = 13 }: { nota: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={1.75}
          className={i < Math.round(nota) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </span>
  );
}

function TipoLabel({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    MEDICO: "Médico", ENFERMEIRO: "Enfermeiro", TECNICO_SAUDE: "Técnico de Saúde",
  };
  return <>{map[tipo] ?? tipo}</>;
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ size: number; strokeWidth: number; className: string }>;
  label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PerfilMedicoClinica() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
      <TopBar titulo="Perfil do Médico" onBack={() => router.back()} />
      <div className="flex justify-center pt-20">
        <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !medico) return (
    <div>
      <TopBar titulo="Perfil do Médico" onBack={() => router.back()} />
      <div className="px-4 pt-10 text-center text-sm text-red-500">{error ?? "Médico não encontrado"}</div>
    </div>
  );

  const iniciais = medico.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const localizacao = [medico.bairro, medico.cidade, medico.provincia].filter(Boolean).join(", ");

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      <TopBar onBack={() => router.back()} />

      {/* Hero com gradiente */}
      <div className="bg-gradient-to-br from-[#0B3C74] via-[#0d4a8a] to-[#00A99D] px-5 pt-6 pb-10 relative">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl shadow-xl shadow-black/30 overflow-hidden ring-4 ring-white/20">
            {medico.foto
              ? <img src={medico.foto} alt={medico.nome} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                  {iniciais}
                </div>
              )}
          </div>

          {/* Nome + badges */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-white font-bold text-2xl tracking-tight">{medico.nome}</h1>
              {medico.verified && (
                <BadgeCheck size={20} strokeWidth={2} className="text-[#7fffd4] shrink-0" />
              )}
            </div>
            <p className="text-blue-200 text-sm font-medium">
              <TipoLabel tipo={medico.tipo} /> · {medico.especialidade}
              {medico.subEspecialidade ? ` · ${medico.subEspecialidade}` : ""}
            </p>
            {localizacao && (
              <p className="text-blue-300 text-xs mt-1.5 flex items-center justify-center gap-1">
                <MapPin size={11} strokeWidth={1.75} />
                {localizacao}
              </p>
            )}
          </div>

          {/* Badges de estado */}
          <div className="flex gap-2 flex-wrap justify-center">
            {medico.verified && (
              <span className="bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
                <BadgeCheck size={10} strokeWidth={2.5} /> Perfil Verificado
              </span>
            )}
            {medico.disponivelAgora && (
              <span className="bg-green-400/25 text-green-200 text-[10px] font-bold px-3 py-1 rounded-full border border-green-400/30 flex items-center gap-1">
                <Clock size={10} strokeWidth={2.5} /> Disponível Agora
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats flutuantes */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-lg shadow-black/8 border border-gray-100 p-4 grid grid-cols-3 divide-x divide-gray-100">
        <div className="text-center px-2">
          <p className="text-[#0B3C74] font-bold text-xl">{medico.rating.toFixed(1)}</p>
          <Stars nota={medico.rating} size={11} />
          <p className="text-gray-400 text-[10px] mt-0.5">{medico.totalAvaliacoes} avaliações</p>
        </div>
        <div className="text-center px-2">
          <p className="text-[#0B3C74] font-bold text-xl">{medico.totalPlantoes}</p>
          <p className="text-gray-500 text-xs font-medium mt-0.5">Plantões</p>
          <p className="text-gray-400 text-[10px]">realizados</p>
        </div>
        <div className="text-center px-2">
          <p className="text-[#0B3C74] font-bold text-xl">{medico.anosExperiencia ?? "—"}</p>
          <p className="text-gray-500 text-xs font-medium mt-0.5">Anos</p>
          <p className="text-gray-400 text-[10px]">experiência</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Sobre */}
        {medico.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MessageCircle size={11} strokeWidth={2} />
              Sobre
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{medico.bio}</p>
          </div>
        )}

        {/* Informações profissionais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Briefcase size={11} strokeWidth={2} />
            Informações Profissionais
          </p>

          <InfoRow icon={Stethoscope} label="Tipo de profissional" value={
            medico.tipo === "MEDICO" ? "Médico" : medico.tipo === "ENFERMEIRO" ? "Enfermeiro" : "Técnico de Saúde"
          } />

          {medico.especialidade && (
            <InfoRow icon={Award} label="Especialidade" value={
              medico.subEspecialidade ? `${medico.especialidade} — ${medico.subEspecialidade}` : medico.especialidade
            } />
          )}

          {medico.anosExperiencia != null && (
            <InfoRow icon={Briefcase} label="Experiência" value={`${medico.anosExperiencia} anos`} />
          )}

          {medico.numeroOrdem && (
            <InfoRow icon={Hash} label="Nº Ordem Médicos" value={medico.numeroOrdem} />
          )}

          {medico.numeroSinome && (
            <InfoRow icon={Hash} label="Nº SINOME" value={medico.numeroSinome} />
          )}

          {medico.numeroOma && (
            <InfoRow icon={Hash} label="Nº OMA" value={medico.numeroOma} />
          )}

          {localizacao && (
            <InfoRow icon={MapPin} label="Localização" value={localizacao} />
          )}

          {medico.verificadoEm && (
            <InfoRow icon={Calendar} label="Verificado em" value={
              new Date(medico.verificadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" })
            } />
          )}
        </div>

        {/* Especialidades / tags */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Stethoscope size={11} strokeWidth={2} />
            Áreas de Actuação
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-50 text-[#0B3C74] text-xs font-semibold px-3 py-1.5 rounded-full">
              {medico.especialidade}
            </span>
            {medico.subEspecialidade && (
              <span className="bg-teal-50 text-[#00A99D] text-xs font-semibold px-3 py-1.5 rounded-full">
                {medico.subEspecialidade}
              </span>
            )}
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
              <TipoLabel tipo={medico.tipo} />
            </span>
          </div>
        </div>

        {/* Credenciais */}
        {medico.credenciais.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BadgeCheck size={11} strokeWidth={2} />
              Credenciais Verificadas
            </p>
            <div className="space-y-3">
              {medico.credenciais.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.tipo}</p>
                    {c.comentario && <p className="text-xs text-gray-500 mt-0.5">{c.comentario}</p>}
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(c.criadoEm).toLocaleDateString("pt-AO", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações */}
        {medico.avaliacoesRecebidas.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Star size={11} strokeWidth={2} />
              Avaliações Recentes
            </p>
            <div className="space-y-4">
              {medico.avaliacoesRecebidas.map((a, i) => (
                <div key={i} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <Stars nota={a.estrelas} />
                    <p className="text-[10px] text-gray-300">
                      {new Date(a.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {a.comentario && (
                    <p className="text-xs text-gray-600 leading-relaxed italic">&ldquo;{a.comentario}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder avaliações */}
        {medico.avaliacoesRecebidas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <Star size={24} className="mx-auto mb-2 text-gray-200" strokeWidth={1.25} />
            <p className="text-xs text-gray-400">Ainda sem avaliações registadas.</p>
          </div>
        )}

      </div>
    </div>
  );
}
