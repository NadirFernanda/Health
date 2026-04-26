"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ChevronLeft, KeyRound } from "lucide-react";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simular delay de envio
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
    }, 1200);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail size={40} strokeWidth={1.5} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Email enviado!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6 max-w-xs">
          Verifique a sua caixa de entrada em <strong className="text-gray-700">{email}</strong>.<br />
          O link de recuperação é válido por 30 minutos.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 w-full max-w-xs text-left">
          <p className="text-xs font-bold text-brand-700 mb-1.5">Não recebeu o email?</p>
          <ul className="text-xs text-brand-600 space-y-1">
            <li>• Verifique a pasta de SPAM/Lixo</li>
            <li>• Aguarde até 5 minutos</li>
            <li>• Confirme que o email está correcto</li>
          </ul>
        </div>
        <button
          onClick={() => setEnviado(false)}
          className="mt-4 text-brand-500 text-sm font-semibold py-2 underline underline-offset-2"
        >
          Reenviar email
        </button>
        <Link href="/login" className="mt-4 text-gray-400 text-sm">
          <span className="inline-flex items-center gap-1"><ChevronLeft size={14} strokeWidth={2} /> Voltar ao login</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/login")} className="text-gray-500 text-lg"><ChevronLeft size={18} strokeWidth={2} /></button>
        <h1 className="font-bold text-gray-900">Recuperar Password</h1>
      </div>

      <div className="flex-1 px-5 pt-10 max-w-sm mx-auto w-full">
        {/* Ícone */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <KeyRound size={30} strokeWidth={1.75} className="text-brand-500" />
          </div>
          <p className="text-sm text-gray-500 leading-6">
            Insira o seu email para receber um link de recuperação de password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
              Endereço de email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.ao"
              autoComplete="email"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-brand-500 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={!email.trim() || loading}
            className="w-full bg-brand-500 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors text-base"
          >
            {loading ? "A enviar..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-gray-400 text-sm">
            Lembrei-me da password · <span className="text-brand-500 font-semibold">Entrar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
