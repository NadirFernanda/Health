import { medicoLogado } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";

export default function PerfilMedico() {
  const m = medicoLogado;

  const credenciais = [
    { label: "Cédula da Ordem dos Médicos", estado: "APROVADO" },
    { label: "Licenciatura em Medicina (UJES)", estado: "APROVADO" },
    { label: "Bilhete de Identidade", estado: "APROVADO" },
  ];

  const avaliacoes = [
    { stars: 5, texto: "Excelente profissional, pontual e muito atencioso.", clinica: "Clínica Saúde+", data: "Mar 2026" },
    { stars: 4, texto: "Boa comunicação, cumpriu o horário sem problemas.", clinica: "Clínica Horizonte", data: "Fev 2026" },
    { stars: 5, texto: "Recomendo! Muito competente.", clinica: "Clínica Central", data: "Jan 2026" },
  ];

  return (
    <div>
      <TopBar titulo="O meu Perfil" />

      {/* Avatar e nome */}
      <div className="bg-white px-4 py-6 flex flex-col items-center border-b border-gray-100">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-[#1A6FBB] mb-3">
          {m.nome.split(" ")[1]?.charAt(0) ?? "J"}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{m.nome}</h1>
        {m.verified && (
          <span className="mt-1.5 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            ✓ VERIFICADO
          </span>
        )}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-yellow-400">⭐</span>
          <span className="text-sm font-semibold text-gray-800">{m.rating}</span>
          <span className="text-gray-400 text-xs">({m.totalAvaliacoes} avaliações)</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{m.especialidade} · {m.provincia}</p>
      </div>

      {/* Estatísticas */}
      <div className="bg-white grid grid-cols-3 border-b border-gray-100">
        {[
          { label: "Plantões", value: m.totalPlantoes },
          { label: "Avaliações", value: m.totalAvaliacoes },
          { label: "Saldo (AOA)", value: (m.saldoCarteira / 1000).toFixed(0) + "k" },
        ].map((s) => (
          <div key={s.label} className="text-center py-4 border-r border-gray-100 last:border-r-0">
            <p className="text-xl font-bold text-[#1A6FBB]">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Informações */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informações Profissionais</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>🔖 Nº Ordem: <span className="font-mono text-gray-900">{m.numeroOrdem}</span></p>
          {m.numeroSinome && <p>📋 Nº SINOME: <span className="font-mono text-gray-900">{m.numeroSinome}</span></p>}
          <p>🩺 Especialidade: {m.especialidade}</p>
          <p>📍 Localização: {m.provincia}</p>
          <p className="text-gray-600 leading-5 mt-1">{m.bio}</p>
        </div>
      </div>

      {/* Verificação Express */}
      {!m.verified && (
        <div className="mx-4 mt-4 bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Perfil não verificado</p>
              <p className="text-xs text-orange-600 mt-1 leading-5">
                A Verificação Express desbloqueia candidaturas a plantões e aumenta a sua taxa de aceitação.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-orange-700">
                <p>✓ Confirmação do SINOME / Ordem</p>
                <p>✓ Validação de BI/Passaporte</p>
                <p>✓ Prazo: 24–48h · Taxa única: <strong>2.500 AOA</strong></p>
              </div>
              <button className="mt-3 w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm">
                Iniciar Verificação Express →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credenciais */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documentos Verificados</h3>
        <div className="space-y-2">
          {credenciais.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5 text-sm">
              <span className="text-[#27AE60]">✅</span>
              <span className="text-gray-800">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avaliações */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Avaliações Recentes</h3>
        <div className="space-y-3">
          {avaliacoes.map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: a.stars }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-xs">⭐</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-5">&ldquo;{a.texto}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">— {a.clinica}, {a.data}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 py-4 space-y-2">
        <button className="w-full border border-[#1A6FBB] text-[#1A6FBB] font-semibold py-3 rounded-2xl text-sm">
          Editar Perfil
        </button>
        <Link href="/" className="block w-full text-center text-red-500 font-semibold py-3 text-sm">
          Terminar Sessão
        </Link>
      </div>
    </div>
  );
}
