import Link from "next/link";
import Image from "next/image";
import { Stethoscope, Building2, ChevronRight } from "lucide-react";

export default function RegistarPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-6 pt-12 pb-10 flex flex-col items-center text-center">
        <div className="bg-white rounded-2xl px-5 py-3 shadow-2xl shadow-black/25 mb-4">
          <Image
            src="/Imagens/LOGO_MED_FREELA.png"
            alt="MedFreela"
            width={160}
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Criar conta</h1>
        <p className="text-blue-100 mt-2 text-sm leading-6 max-w-xs">
          Escolha o tipo de conta para começar
        </p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        <p className="text-center text-gray-500 text-sm mb-2">O que descreve melhor a sua situação?</p>

        <Link
          href="/registar/profissional"
          className="block bg-[#0B3C74] hover:bg-[#00A99D] text-white rounded-2xl p-5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope size={24} strokeWidth={1.75} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">Sou Profissional de Saúde</p>
              <p className="text-blue-200 text-sm mt-0.5">Médico, enfermeiro ou técnico — encontre turnos e salas</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.75} className="text-blue-200" />
          </div>
        </Link>

        <Link
          href="/registar/clinica"
          className="block bg-white border-2 border-[#0B3C74] rounded-2xl p-5 transition-colors hover:bg-blue-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={24} strokeWidth={1.75} className="text-[#0B3C74]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base text-gray-900">Sou Clínica / Consultório</p>
              <p className="text-gray-500 text-sm mt-0.5">Publique turnos e alugue salas a profissionais verificados</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
        </Link>

        <p className="text-center text-gray-400 text-sm mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#0B3C74] font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
