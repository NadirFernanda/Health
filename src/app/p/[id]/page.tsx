import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Star, MapPin, Stethoscope, Award, Clock, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default async function PerfilPublicoMedico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const prof = await prisma.profissional.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      tipo: true,
      especialidade: true,
      subEspecialidade: true,
      anosExperiencia: true,
      provincia: true,
      cidade: true,
      foto: true,
      bio: true,
      rating: true,
      totalAvaliacoes: true,
      totalPlantoes: true,
      verified: true,
      estadoVerificacao: true,
      disponivelAgora: true,
      avaliacoesRecebidas: {
        where: { comentario: { not: null } },
        orderBy: { criadoEm: "desc" },
        take: 5,
        select: {
          estrelas: true,
          comentario: true,
          criadoEm: true,
          autor: { select: { nome: true } },
          alvoClinica: { select: { nome: true } },
        },
      },
    },
  });

  if (!prof) notFound();

  const iniciais = prof.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#1a5fba] px-5 pt-10 pb-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 text-sm mb-6 hover:text-white transition-colors">
          <ArrowLeft size={14} strokeWidth={2} /> MedFreela
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-white/40 overflow-hidden bg-white/20 shrink-0">
            {prof.foto ? (
              <img src={prof.foto} alt={prof.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                {iniciais}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl leading-tight">{prof.nome}</h1>
            <p className="text-blue-200 text-sm mt-0.5">
              {prof.especialidade}{prof.subEspecialidade ? ` · ${prof.subEspecialidade}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {prof.estadoVerificacao === "APROVADO" && (
                <span className="inline-flex items-center gap-1 bg-green-400/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  <BadgeCheck size={11} strokeWidth={2.5} /> VERIFICADO
                </span>
              )}
              {prof.estadoVerificacao === "EM_ANALISE" && (
                <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-200 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Clock size={11} strokeWidth={2.5} /> EM VERIFICAÇÃO
                </span>
              )}
              {prof.estadoVerificacao === "REJEITADO" && (
                <span className="inline-flex items-center gap-1 bg-red-400/20 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  <XCircle size={11} strokeWidth={2.5} /> NÃO VERIFICADO
                </span>
              )}
              {prof.estadoVerificacao === "PENDENTE" && (
                <span className="inline-flex items-center gap-1 bg-white/10 text-blue-200 text-xs font-bold px-2.5 py-1 rounded-full">
                  <AlertCircle size={11} strokeWidth={2.5} /> PENDENTE
                </span>
              )}
              {prof.disponivelAgora && (
                <span className="inline-flex items-center gap-1 bg-[#00A99D]/30 text-teal-200 text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse" /> DISPONÍVEL
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats sobrepostos ao header */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl border border-gray-100 shadow-md grid grid-cols-3 divide-x divide-gray-100 mb-4">
        {[
          { label: "Plantões", value: prof.totalPlantoes },
          { label: "Avaliações", value: prof.totalAvaliacoes },
          { label: "Rating", value: prof.totalAvaliacoes > 0 ? prof.rating.toFixed(1) : "—" },
        ].map((s) => (
          <div key={s.label} className="text-center py-4">
            <p className="text-xl font-black text-[#0B3C74]">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Informações */}
      <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informações</h3>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Stethoscope size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Especialidade</p>
            <p className="font-semibold text-gray-900">{prof.especialidade}{prof.subEspecialidade ? ` · ${prof.subEspecialidade}` : ""}</p>
          </div>
        </div>
        {prof.anosExperiencia && prof.anosExperiencia > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <Award size={14} strokeWidth={1.75} className="text-[#00A99D]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Experiência</p>
              <p className="font-semibold text-gray-900">{prof.anosExperiencia} {prof.anosExperiencia === 1 ? "ano" : "anos"}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={14} strokeWidth={1.75} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Localização</p>
            <p className="font-semibold text-gray-900">{prof.cidade ? `${prof.cidade}, ` : ""}{prof.provincia}</p>
          </div>
        </div>
        {prof.bio && (
          <p className="text-gray-600 leading-6 text-sm bg-gray-50 rounded-xl px-3 py-3 mt-2">{prof.bio}</p>
        )}
      </div>

      {/* Avaliações */}
      {prof.avaliacoesRecebidas.length > 0 && (
        <div className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avaliações</h3>
            <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
              <Star size={14} strokeWidth={1.75} className="fill-yellow-400" />
              {prof.rating.toFixed(1)} ({prof.totalAvaliacoes})
            </span>
          </div>
          <div className="space-y-3">
            {prof.avaliacoesRecebidas.map((av, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700">
                    {av.autor?.nome ?? av.alvoClinica?.nome ?? "Utilizador"}
                  </p>
                  <span className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
                    <Star size={10} className="fill-yellow-400" /> {av.estrelas}
                  </span>
                </div>
                {av.comentario && <p className="text-xs text-gray-500 italic">"{av.comentario}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mx-4">
        <Link
          href="/login"
          className="block w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-sm text-center"
        >
          Convidar para plantão via MedFreela
        </Link>
      </div>
    </div>
  );
}
