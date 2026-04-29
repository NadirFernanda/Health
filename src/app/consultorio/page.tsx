import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User, DoorOpen, Clock, TrendingUp, Plus } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function ConsultorioDashboard() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") redirect("/login");

  const consultorio = await prisma.consultorio.findUnique({
    where: { userId: session.id },
    include: {
      salas: {
        include: {
          _count: { select: { reservas: true } },
        },
      },
    },
  });
  if (!consultorio) redirect("/login");

  const totalSalas = consultorio.salas.length;
  const totalReservas = consultorio.salas.reduce((s, sala) => s + sala._count.reservas, 0);

  // Reservas recentes
  const reservasRecentes = await prisma.reservaSala.findMany({
    where: { sala: { consultorioId: consultorio.id } },
    include: { sala: true, profissional: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
    take: 5,
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#00A99D] to-[#0B3C74] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-teal-100 text-sm">Bem-vindo</p>
            <h1 className="text-white font-bold text-xl">{consultorio.nome}</h1>
            {consultorio.zonaLuanda && (
              <p className="text-teal-200 text-xs mt-0.5">{consultorio.zonaLuanda}, Luanda</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/consultorio/notificacoes" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
              <Bell size={18} strokeWidth={1.75} className="text-white" />
            </Link>
            <Link href="/consultorio/conta" className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
              <User size={18} strokeWidth={1.75} className="text-white" />
            </Link>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-3.5">
            <p className="text-teal-100 text-xs">Salas publicadas</p>
            <p className="text-white font-bold text-2xl mt-1">{totalSalas}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3.5">
            <p className="text-teal-100 text-xs">Total de reservas</p>
            <p className="text-white font-bold text-2xl mt-1">{totalReservas}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Acção rápida */}
        <Link
          href="/consultorio/salas/nova"
          className="flex items-center gap-3 bg-[#00A99D] text-white rounded-2xl px-5 py-4"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-sm">Publicar nova sala</p>
            <p className="text-teal-100 text-xs">Adicione uma sala disponível para alugar</p>
          </div>
        </Link>

        {/* Minhas salas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">As minhas salas</h2>
            <Link href="/consultorio/salas" className="text-[#00A99D] text-sm font-semibold">Ver todas</Link>
          </div>

          {consultorio.salas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <DoorOpen size={36} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Ainda não publicou nenhuma sala.</p>
              <Link href="/consultorio/salas/nova" className="inline-block mt-3 text-[#00A99D] text-sm font-semibold">
                Publicar primeira sala →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {consultorio.salas.slice(0, 3).map((sala) => (
                <Link key={sala.id} href={`/consultorio/salas/${sala.id}`} className="block bg-white rounded-2xl border border-gray-100 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sala.nome}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{sala.tipo} · {sala._count.reservas} reserva{sala._count.reservas !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00A99D] text-sm">{formatAOA(sala.precoPorHora)}/h</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sala.disponivel ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {sala.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Reservas recentes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">Reservas recentes</h2>
          </div>

          {reservasRecentes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <Clock size={36} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Ainda sem reservas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservasRecentes.map((r) => {
                const inicio = new Date(r.data);
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.profissional.nome}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{r.sala.nome} · {r.duracaoHoras}h</p>
                        <p className="text-gray-400 text-xs">
                          {inicio.toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0B3C74] text-sm">{formatAOA(r.valorTotal)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.estado === "CONFIRMADA" ? "bg-green-100 text-green-700" :
                          r.estado === "PENDENTE_PAGAMENTO" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {r.estado === "CONFIRMADA" ? "Confirmada" : r.estado === "PENDENTE_PAGAMENTO" ? "Pendente" : r.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
