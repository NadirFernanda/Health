"use client";

import { useActionState, useState } from "react";
import { registerClinicaAction, RegisterState } from "@/app/actions/register";
import Link from "next/link";
import { Eye, EyeOff, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const zonas = [
  "Centralidade Horizonte",
  "Talatona",
  "Miramar",
  "Alvalade",
  "Kilamba",
  "Maianga",
  "Ingombota",
  "Sambizanga",
  "Cazenga",
  "Outro",
];

export default function RegistarClinicaPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    zonaLuanda: "",
    morada: "",
    contacto: "",
    email: "",
    password: "",
  });

  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerClinicaAction,
    null
  );

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const step1Valid = form.nome.trim().length >= 2 && form.zonaLuanda;
  const step2Valid = form.email.includes("@") && form.password.length >= 8;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/registar" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ChevronLeft size={20} strokeWidth={1.75} />
          </Link>
          <h1 className="text-white font-bold text-lg">Criar conta — Clínica</h1>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
        <p className="text-blue-200 text-xs mt-2">Passo {step} de 2</p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="nome" value={form.nome} />
        <input type="hidden" name="zonaLuanda" value={form.zonaLuanda} />
        <input type="hidden" name="morada" value={form.morada} />
        <input type="hidden" name="contacto" value={form.contacto} />
        <input type="hidden" name="email" value={form.email} />
        <input type="hidden" name="password" value={form.password} />

        <div className="px-4 py-6 space-y-4">

          {/* PASSO 1 — Dados da clínica */}
          {step === 1 && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <h2 className="font-bold text-gray-900 text-sm">Dados da Clínica</h2>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Nome da clínica / consultório *
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    placeholder="ex: Clínica Horizonte Saúde"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A6FBB] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Zona em Luanda *
                  </label>
                  <select
                    value={form.zonaLuanda}
                    onChange={(e) => set("zonaLuanda", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A6FBB] bg-white transition-colors"
                  >
                    <option value="">Seleccione a zona...</option>
                    {zonas.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Morada
                  </label>
                  <input
                    type="text"
                    value={form.morada}
                    onChange={(e) => set("morada", e.target.value)}
                    placeholder="ex: Rua da Missão, n.º 45"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A6FBB] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Contacto (telefone / WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={form.contacto}
                    onChange={(e) => set("contacto", e.target.value)}
                    placeholder="ex: +244 923 000 000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A6FBB] transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full bg-[#1A6FBB] disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
              >
                Continuar <ChevronRight size={16} strokeWidth={2} />
              </button>
            </>
          )}

          {/* PASSO 2 — Acesso */}
          {step === 2 && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <h2 className="font-bold text-gray-900 text-sm">Dados de Acesso</h2>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="clinica@exemplo.ao"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A6FBB] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Palavra-passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#1A6FBB] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo 8 caracteres</p>
                  )}
                </div>
              </div>

              {state?.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={15} strokeWidth={2} />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-sm"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={pending || !step2Valid}
                  className="flex-1 bg-[#1A6FBB] disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
                >
                  {pending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A criar...</>
                  ) : (
                    <>Criar conta <ChevronRight size={16} strokeWidth={2} /></>
                  )}
                </button>
              </div>
            </>
          )}

          <p className="text-center text-gray-400 text-xs">
            Ao criar conta aceita os nossos{" "}
            <span className="text-[#1A6FBB]">Termos de Serviço</span>
            {" "}e{" "}
            <span className="text-[#1A6FBB]">Política de Privacidade</span>.
          </p>
        </div>
      </form>
    </div>
  );
}
