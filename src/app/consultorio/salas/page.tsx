import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { DoorOpen, Plus, CheckCircle, XCircle } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function ConsultorioSalasPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") redirect("/login");

  const consultorio = await prisma.consultorio.findUnique({
    where: { userId: session.id },
    include: {
      salas: {
        include: { _count: { select: { reservas: true } } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });
  if (!consultorio) redirect("/login");

  return (
    <div>
      <TopBar
        titulo="As minhas salas"
        back="/consultorio"
        actions={
          <Link
            href="/consultorio/salas/nova"
            className="bg-[#00A99D] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
          >
            + Nova
          </Link>
        }
      />

      <div className="px-4 py-5 space-y-4">
        {consultorio.salas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <DoorOpen size={40} strokeWidth={1} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 text-sm">Ainda não tem salas publicadas</p>
            <p className="text-gray-400 text-xs mt-1">Publique a sua primeira sala para médicos a alugarem</p>
            <Link
              href="/consultorio/salas/nova"
              className="inline-flex items-center gap-2 mt-4 bg-[#00A99D] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              <Plus size={16} strokeWidth={2} /> Publicar sala
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {consultorio.salas.length} sala(s) registada(s)
            </p>
            <div className="space-y-3">
              {consultorio.salas.map((sala) => (
                <Link key={sala.id} href={`/consultorio/salas/${sala.id}`} className="block bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <DoorOpen size={18} strokeWidth={1.75} className="text-[#00A99D]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{sala.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sala._count.reservas} reserva(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00A99D] text-sm">
                        {formatAOA(sala.precoPorHora)}<span className="text-gray-400 font-normal text-xs">/h</span>
                      </p>
                      <span className={`text-xs font-semibold inline-flex items-center gap-1 ${sala.disponivel ? "text-green-600" : "text-red-500"}`}>
                        {sala.disponivel
                          ? <><CheckCircle size={11} strokeWidth={2} /> Disponível</>
                          : <><XCircle size={11} strokeWidth={2} /> Indisponível</>}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
