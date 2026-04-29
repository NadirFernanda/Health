"use client";
import { useState, useEffect } from "react";

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS ?? "planto@admin2025";
const SESSION_KEY = "planto_admin_auth";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed,  setAuthed]  = useState(false);
  const [input,   setInput]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(true);

  // Verificar sessão existente após hidratação
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setLoading(false);
  }, []);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setErro("");
    } else {
      setErro("Palavra-passe incorrecta.");
      setInput("");
    }
  }

  if (loading) return null;

  if (authed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[300] bg-[#062855] flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[#0B3C74] font-black text-3xl tracking-tight">PLANTO</p>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Painel Administrativo</p>
        </div>

        <form onSubmit={entrar} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Palavra-passe</label>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setErro(""); }}
              placeholder="••••••••••"
              autoFocus
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0B3C74] transition-colors"
            />
          </div>

          {erro && (
            <p className="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-lg">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#0B3C74] hover:bg-[#093264] text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Acesso restrito a administradores PLANTO
        </p>
      </div>
    </div>
  );
}
