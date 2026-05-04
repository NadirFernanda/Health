import { getAuthSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import { redirect, notFound } from "next/navigation";
import ChatWindow from "@/components/chat-window";
import { BadgeCheck, Star } from "lucide-react";

export default async function ChatClinicaPage({
  params,
}: {
  params: Promise<{ id: string; candidaturaId: string }>;
}) {
  const { id: plantaoId, candidaturaId } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await getClinicaFromSession(session);
  if (!clinica) redirect("/login");

  const candidatura = await prisma.candidatura.findFirst({
    where: { id: candidaturaId, plantao: { clinicaId: clinica.id } },
    include: {
      profissional: true,
      plantao: true,
    },
  });
  if (!candidatura) return notFound();

  const mensagemInicial = candidatura.mensagem ?? null;

  return (
    <div className="flex flex-col h-dvh">
      <TopBar
        titulo={candidatura.profissional.nome}
        back={`/clinica/plantoes/${plantaoId}`}
      />

      {/* Mini perfil do médico */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-[#0B3C74] shrink-0">
          {candidatura.profissional.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 text-sm truncate">{candidatura.profissional.nome}</p>
            {candidatura.profissional.verified && (
              <BadgeCheck size={13} strokeWidth={2} className="text-[#00A99D] shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{candidatura.profissional.especialidade}</span>
            <span className="text-gray-200">·</span>
            <Star size={10} strokeWidth={1.75} className="text-yellow-400 fill-yellow-400" />
            <span>{candidatura.profissional.rating.toFixed(1)}</span>
            <span className="text-gray-200">·</span>
            <span>{candidatura.profissional.totalPlantoes} plantões</span>
          </div>
        </div>
      </div>

      <ChatWindow
        candidaturaId={candidaturaId}
        outroNome={candidatura.profissional.nome}
        mensagemInicial={mensagemInicial}
        estadoInicial={candidatura.estado}
      />
    </div>
  );
}
