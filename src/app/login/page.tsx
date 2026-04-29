import LoginForm from "./login-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Entrar — Medfreela" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#062855] via-[#0B3C74] to-[#00A99D] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Voltar */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Página inicial
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-2xl shadow-black/25 mb-2">
            <img
              src="/Imagens/LOGO_MED_FREELA.png"
              alt="MedFreela"
              className="object-contain h-20 w-auto"
            />
          </div>
          <p className="text-blue-300/70 text-sm mt-3">Gestão de Plantões Médicos · Angola</p>
        </div>

        {/* Card de login */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-1">Bem-vindo de volta</h2>
          <p className="text-blue-200/60 text-sm mb-6">Entre com o seu e-mail e palavra-passe</p>

          <LoginForm searchParams={searchParams} />
        </div>

        {/* Criar conta */}
        <p className="text-center text-sm text-white/50 mt-5">
          Não tem conta?{" "}
          <a href="/registar" className="text-blue-300 font-semibold hover:text-white transition-colors">
            Criar conta gratuita
          </a>
        </p>

        <p className="text-center text-xs text-white/20 mt-4">
          Medfreela © 2026 · Huambo, Angola
        </p>
      </div>
    </div>
  );
}
