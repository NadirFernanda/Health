import Link from "next/link";
import {
  Stethoscope, Building2, BadgeCheck, Banknote, BedDouble, ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Stethoscope size={32} strokeWidth={1.75} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">MedFreela</h1>
        <p className="text-blue-100 mt-4 text-sm leading-6 max-w-xs">
          A plataforma que transforma profissionais
          disponíveis e consultórios vazios em
          serviços de saúde activos.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#1A6FBB]">41</p>
          <p className="text-xs text-gray-500 mt-0.5">Turnos realizados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#27AE60]">20+</p>
          <p className="text-xs text-gray-500 mt-0.5">Profissionais verificados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A6FBB]">5</p>
          <p className="text-xs text-gray-500 mt-0.5">Clínicas parceiras</p>
        </div>
      </div>

      {/* Escolher perfil */}
      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        <p className="text-center text-gray-500 text-sm mb-2">Como quer entrar?</p>

        <Link
          href="/medico"
          className="block bg-[#1A6FBB] hover:bg-[#0D4F8A] text-white rounded-2xl p-5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope size={24} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-base">Sou Profissional de Saúde</p>
              <p className="text-blue-200 text-sm mt-0.5">Médico, enfermeiro ou técnico — encontre turnos e receba em segurança</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-blue-200" />
          </div>
        </Link>

        <Link
          href="/clinica"
          className="block bg-white border-2 border-[#1A6FBB] text-[#1A6FBB] rounded-2xl p-5 transition-colors hover:bg-blue-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={24} strokeWidth={1.75} className="text-[#1A6FBB]" />
            </div>
            <div>
              <p className="font-bold text-base text-gray-900">Sou Clínica / Consultório</p>
              <p className="text-gray-500 text-sm mt-0.5">Publique turnos e encontre profissionais verificados</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-[#1A6FBB]" />
          </div>
        </Link>

        {/* Diferenciais */}
        <div className="mt-4 space-y-3">
          {[
            { icon: BadgeCheck, title: "Profissionais verificados", desc: "Credenciais validadas via SINOME/OMA antes de cada turno" },
            { icon: Banknote, title: "Pagamento garantido", desc: "Via Multicaixa Express, sem atrasos ou informalidade" },
            { icon: BedDouble, title: "Equipamentos declarados", desc: "Saiba exatamente o que há na sala antes de aceitar" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <item.icon size={20} strokeWidth={1.75} className="text-[#1A6FBB] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          A operar em Luanda · Centralidade Horizonte
        </p>

        <Link href="/admin" className="block text-center text-xs text-gray-300 hover:text-gray-400 mt-2 pb-2 transition-colors">
          Acesso Administrador
        </Link>
      </div>
    </div>
  );
}
