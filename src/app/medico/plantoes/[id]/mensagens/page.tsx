import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import { redirect, notFound } from "next/navigation";
import ChatWindow from "@/components/chat-window";
import { BadgeCheck } from "lucide-react";

export default async function ChatMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: plantaoId } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");

  const prof = await getProfissionalFromSession(session);
  if (!prof) redirect("/login");

  const candidatura = await prisma.candidatura.findUnique({
    where: { plantaoId_profissionalId: { plantaoId, profissionalId: prof.id } },
    include: {
      plantao: { include: { clinica: true, profissionalPublicador: true } },
    },
  });
  if (!candidatura) return notFound();

  const outroNome =
    candidatura.plantao.clinica?.nome ??
    candidatura.plantao.profissionalPublicador?.nome ??
    "Clínica";

  const outroVerificado =
    candidatura.plantao.clinica?.verified ??
    candidatura.plantao.profissionalPublicador?.verified ??
    false;

  return (
    <div className="flex flex-col h-dvh">
      <TopBar
        titulo={outroNome}
        back={`/medico/plantoes/${plantaoId}`}
      />

      {/* Mini info da outra parte */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-[#0B3C74] shrink-0">
          {outroNome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 text-sm truncate">{outroNome}</p>
            {outroVerificado && (
              <BadgeCheck size={13} strokeWidth={2} className="text-[#00A99D] shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">
            Plantão: {candidatura.plantao.especialidade} ·{" "}
            {candidatura.plantao.dataInicio.toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
            })}
          </p>
        </div>
      </div>

      <ChatWindow
        candidaturaId={candidatura.id}
        outroNome={outroNome}
        mensagemInicial={candidatura.mensagem ?? null}
        estadoInicial={candidatura.estado}
      />
    </div>
  );
}
