"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, ChevronLeft } from "lucide-react";
import Link from "next/link";

const TIPO_LABELS: Record<string, string> = {
  NAO_COMPARECEU: "Médico não compareceu",
  NAO_PAGOU: "Clínica não pagou",
  QUALIDADE: "Problema de qualidade",
  CANCELAMENTO: "Cancelamento indevido",
  OUTRO: "Outro",
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default function AdminDisputaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [disputa, setDisputa] = useState<any>(null);
  const [mensagem, setMensagem] = useState("");
  const [estado, setEstado] = useState("");
  const [nota, setNota] = useState("");
  const [ajusteValor, setAjusteValor] = useState("");
  const [ajustePara, setAjustePara] = useState<"MEDICO" | "CLINICA" | "">("");
  const [saving, setSaving] = useState(false);
  const [msgSaving, setMsgSaving] = useState(false);

  async function load() {
    const d = await fetch(`/api/admin/disputas/${id}`).then((r) => r.json());
    setDisputa(d);
    setEstado(d.estado);
  }

  useEffect(() => { load(); }, [id]);

  async function enviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    setMsgSaving(true);
    await fetch(`/api/disputas/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpo: mensagem }),
    });
    setMensagem("");
    await load();
    setMsgSaving(false);
  }

  async function resolver() {
    if (!estado) return;
    setSaving(true);
    const ajusteValorKz = ajusteValor ? parseInt(ajusteValor) : undefined;
    const ajusteParaUserId = ajustePara === "MEDICO"
      ? disputa?.candidatura?.profissional?.userId
      : ajustePara === "CLINICA"
      ? disputa?.candidatura?.plantao?.clinica?.userId
      : undefined;

    await fetch(`/api/admin/disputas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado,
        resolucaoNota: nota || undefined,
        ajusteValorKz,
        ajusteParaUserId,
        mensagem: nota || undefined,
      }),
    });
    setSaving(false);
    router.push("/admin/disputas");
  }

  if (!disputa) {
    return (
      <div className="p-4 pt-10 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const medicoUserId = disputa.candidatura?.profissional?.userId;
  const clinicaUserId = disputa.candidatura?.plantao?.clinica?.userId;

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 pt-1">
        <Link href="/admin/disputas" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={20} strokeWidth={2} />
        </Link>
        <h1 className="text-base font-bold text-gray-900">Disputa #{id.slice(0, 8)}</h1>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <p className="text-sm font-bold text-gray-800">{TIPO_LABELS[disputa.tipo] ?? disputa.tipo}</p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">{disputa.candidatura?.profissional?.nome}</span>
          <span className="mx-1 text-gray-300">↔</span>
          <span className="font-medium">{disputa.candidatura?.plantao?.clinica?.nome ?? "—"}</span>
        </p>
        <p className="text-xs text-gray-500">
          {disputa.candidatura?.plantao?.especialidade} ·{" "}
          {disputa.candidatura?.plantao?.valorKwanzas ? formatAOA(disputa.candidatura.plantao.valorKwanzas) : ""}
        </p>
        <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mt-2">{disputa.descricao}</p>
        <p className="text-xs text-gray-400">
          Saldo médico: <span className="font-semibold text-gray-700">
            {formatAOA(disputa.candidatura?.profissional?.saldoCarteira ?? 0)}
          </span>
        </p>
      </div>

      {/* Thread de mensagens */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mensagens</p>
        {disputa.mensagens?.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Sem mensagens ainda.</p>
        )}
        {disputa.mensagens?.map((m: any) => {
          const isAdmin = m.autor?.role === "ADMIN";
          return (
            <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                isAdmin ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-800"
              }`}>
                {isAdmin && <p className="text-[10px] opacity-60 mb-0.5">Admin</p>}
                <p className="leading-relaxed">{m.corpo}</p>
                <p className={`text-[10px] mt-1 ${isAdmin ? "opacity-50" : "text-gray-400"}`}>
                  {new Date(m.criadoEm).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <form onSubmit={enviarMensagem} className="flex gap-2 pt-1">
          <input
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Responder às partes..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30"
          />
          <button
            type="submit"
            disabled={msgSaving || !mensagem.trim()}
            className="w-10 h-10 rounded-xl bg-[#0B3C74] text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send size={15} strokeWidth={2} />
          </button>
        </form>
      </div>

      {/* Resolução */}
      {disputa.estado !== "RESOLVIDA" && disputa.estado !== "ENCERRADA" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resolução</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30"
            >
              <option value="EM_ANALISE">Em análise</option>
              <option value="RESOLVIDA">Resolvida</option>
              <option value="ENCERRADA">Encerrada (sem mérito)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nota de resolução</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Explica a decisão para ambas as partes..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30"
            />
          </div>

          {estado === "RESOLVIDA" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ajuste financeiro (AOA)</label>
                <input
                  type="number"
                  value={ajusteValor}
                  onChange={(e) => setAjusteValor(e.target.value)}
                  placeholder="Ex: 15000 (positivo = crédito, negativo = débito)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30"
                />
              </div>
              {ajusteValor && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Aplicar ajuste a</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAjustePara("MEDICO")}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                        ajustePara === "MEDICO" ? "bg-[#0B3C74] text-white border-[#0B3C74]" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {disputa.candidatura?.profissional?.nome?.split(" ")[0]} (médico)
                    </button>
                    {clinicaUserId && (
                      <button
                        type="button"
                        onClick={() => setAjustePara("CLINICA")}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                          ajustePara === "CLINICA" ? "bg-[#0B3C74] text-white border-[#0B3C74]" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {disputa.candidatura?.plantao?.clinica?.nome?.split(" ")[0]} (clínica)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={resolver}
            disabled={saving}
            className="w-full bg-[#0B3C74] hover:bg-[#092e5a] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
          >
            {saving ? "A guardar..." : "Guardar decisão"}
          </button>
        </div>
      )}

      {(disputa.estado === "RESOLVIDA" || disputa.estado === "ENCERRADA") && disputa.resolucaoNota && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-green-700 mb-1">Decisão final</p>
          <p className="text-xs text-green-800">{disputa.resolucaoNota}</p>
          {disputa.ajusteValorKz && (
            <p className="text-xs font-bold text-green-700 mt-2">
              Ajuste: {disputa.ajusteValorKz > 0 ? "+" : ""}{formatAOA(disputa.ajusteValorKz)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
