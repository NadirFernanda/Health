"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/nav";
import {
  Upload, CheckCircle, XCircle, Clock, FileText,
  AlertTriangle, ChevronRight, Eye,
} from "lucide-react";

const DOCS_CONFIG = [
  { tipo: "ALVARA",               label: "Alvará de Funcionamento",             descricao: "Licença Sanitária actualizada emitida pelo MINSA" },
  { tipo: "REGISTO_COMERCIAL",    label: "Certificado de Registo Comercial",    descricao: "Emitido pelo MAPTESS / Conservatória do Registo Comercial" },
  { tipo: "NIF",                  label: "NIF da Instituição",                  descricao: "Cartão de Contribuinte da entidade" },
  { tipo: "CARTEIRA_DIRETOR",     label: "Carteira do Director Clínico",        descricao: "Carteira Profissional emitida pela Ordem dos Médicos de Angola" },
  { tipo: "TERMO_RESPONSABILIDADE", label: "Termo de Responsabilidade Técnica", descricao: "Documento assinado pelo Director Técnico responsável" },
] as const;

type EstadoDoc = "NAO_ENVIADO" | "PENDENTE" | "APROVADO" | "REJEITADO";

type DocInfo = {
  tipo: string;
  id: string | null;
  estado: EstadoDoc;
  url: string | null;
  criadoEm: string | null;
};

function EstadoBadge({ estado }: { estado: EstadoDoc }) {
  const map: Record<EstadoDoc, { label: string; cls: string; icon: React.ReactNode }> = {
    NAO_ENVIADO: { label: "Por enviar",  cls: "bg-gray-100 text-gray-500",    icon: <Clock size={11} strokeWidth={2} /> },
    PENDENTE:    { label: "Em análise", cls: "bg-yellow-100 text-yellow-700", icon: <Clock size={11} strokeWidth={2} /> },
    APROVADO:    { label: "Aprovado",   cls: "bg-green-100 text-green-700",   icon: <CheckCircle size={11} strokeWidth={2} /> },
    REJEITADO:   { label: "Rejeitado",  cls: "bg-red-100 text-red-700",       icon: <XCircle size={11} strokeWidth={2} /> },
  };
  const { label, cls, icon } = map[estado];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {icon} {label}
    </span>
  );
}

export default function ClinicaDocumentosPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [submetendo, setSubmetendo] = useState(false);
  const [estadoVerificacao, setEstadoVerificacao] = useState<string>("PENDENTE");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/clinica/documentos").then((r) => r.json()),
      fetch("/api/clinica/perfil").then((r) => r.json()),
    ])
      .then(([docData, perfil]) => {
        if (Array.isArray(docData)) setDocs(docData as DocInfo[]);
        if (perfil?.estadoVerificacao) setEstadoVerificacao(perfil.estadoVerificacao);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(tipo: string, file: File) {
    setUploading((p) => ({ ...p, [tipo]: true }));
    setErros((p) => ({ ...p, [tipo]: "" }));

    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("file", file);

    const res = await fetch("/api/clinica/documentos", { method: "POST", body: fd });
    const data = await res.json() as { ok?: boolean; error?: string };

    setUploading((p) => ({ ...p, [tipo]: false }));

    if (res.ok && data.ok) {
      const refreshed = await fetch("/api/clinica/documentos").then((r) => r.json()) as DocInfo[];
      setDocs(refreshed);
    } else {
      setErros((p) => ({ ...p, [tipo]: data.error ?? "Erro ao carregar documento." }));
    }
  }

  async function submeter() {
    setSubmetendo(true);
    const res = await fetch("/api/clinica/documentos/submeter", { method: "POST" });
    const data = await res.json() as { ok?: boolean; error?: string; estadoVerificacao?: string };
    setSubmetendo(false);

    if (res.ok && data.ok) {
      setEstadoVerificacao(data.estadoVerificacao ?? "EM_ANALISE");
    } else {
      alert(data.error ?? "Erro ao submeter para verificação.");
    }
  }

  const todosCarregados = DOCS_CONFIG.every((d) => {
    const doc = docs.find((x) => x.tipo === d.tipo);
    return doc && doc.estado !== "NAO_ENVIADO";
  });

  const algumRejeitado = docs.some((d) => d.estado === "REJEITADO");
  const todosAprovados = DOCS_CONFIG.every((d) => docs.find((x) => x.tipo === d.tipo)?.estado === "APROVADO");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <TopBar titulo="Documentos" back="/clinica/conta" />
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-10">
      <TopBar titulo="Documentos de Verificação" back="/clinica/conta" />

      {/* Estado geral */}
      <div className="px-4 pt-4">
        {estadoVerificacao === "APROVADO" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 mb-4">
            <CheckCircle size={20} strokeWidth={2} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-sm">Clínica verificada!</p>
              <p className="text-xs text-green-600 mt-0.5">Todos os documentos foram aprovados. A tua clínica está verificada.</p>
            </div>
          </div>
        )}
        {estadoVerificacao === "EM_ANALISE" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 mb-4">
            <Clock size={20} strokeWidth={2} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-800 text-sm">Em análise</p>
              <p className="text-xs text-blue-600 mt-0.5">Os documentos foram submetidos e estão a ser analisados pela equipa MedFreela (até 7 dias úteis).</p>
            </div>
          </div>
        )}
        {estadoVerificacao === "REJEITADO" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-4">
            <XCircle size={20} strokeWidth={2} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Verificação rejeitada</p>
              <p className="text-xs text-red-600 mt-0.5">Alguns documentos foram rejeitados. Corrija e volte a submeter.</p>
            </div>
          </div>
        )}
      </div>

      {/* Instrução */}
      <div className="px-4 mb-2">
        <p className="text-xs text-gray-500 leading-5">
          Carregue os 5 documentos abaixo em formato <strong>PDF, JPG ou PNG</strong> (máx. 10 MB cada). Após o envio de todos, clique em <strong>Submeter para Verificação</strong>.
        </p>
      </div>

      {/* Lista de documentos */}
      <div className="px-4 space-y-3">
        {DOCS_CONFIG.map(({ tipo, label, descricao }) => {
          const doc = docs.find((d) => d.tipo === tipo);
          const estado: EstadoDoc = doc?.estado ?? "NAO_ENVIADO";
          const isUploading = !!uploading[tipo];
          const erro = erros[tipo];

          return (
            <div key={tipo} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-4">{descricao}</p>
                </div>
                <EstadoBadge estado={estado} />
              </div>

              {erro && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                  <AlertTriangle size={12} strokeWidth={2} />
                  {erro}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {doc?.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-semibold py-2 px-3 rounded-xl text-xs"
                  >
                    <Eye size={13} strokeWidth={2} />
                    Ver
                  </a>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  ref={(el) => { fileRefs.current[tipo] = el; }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(tipo, f);
                    e.target.value = "";
                  }}
                />
                {estado !== "APROVADO" && (
                  <button
                    disabled={isUploading}
                    onClick={() => fileRefs.current[tipo]?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0B3C74] text-white font-bold py-2 rounded-xl text-xs disabled:opacity-50"
                  >
                    {isUploading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={13} strokeWidth={2.5} />
                        {estado === "NAO_ENVIADO" ? "Carregar" : "Substituir"}
                      </>
                    )}
                  </button>
                )}
                {estado === "APROVADO" && (
                  <span className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 font-bold py-2 rounded-xl text-xs">
                    <CheckCircle size={13} strokeWidth={2} /> Aprovado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão submeter */}
      {!todosAprovados && estadoVerificacao !== "EM_ANALISE" && (
        <div className="px-4 mt-5">
          {todosCarregados && !algumRejeitado ? (
            <button
              onClick={submeter}
              disabled={submetendo}
              className="w-full bg-[#00A99D] text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText size={18} strokeWidth={2} />
              {submetendo ? "A submeter…" : "Submeter para Verificação"}
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-orange-700 font-semibold">
                {algumRejeitado
                  ? "Substitua os documentos rejeitados antes de resubmeter."
                  : `Ainda faltam ${DOCS_CONFIG.filter((d) => !docs.find((x) => x.tipo === d.tipo) || docs.find((x) => x.tipo === d.tipo)?.estado === "NAO_ENVIADO").length} documento(s) para poder submeter.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
