import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { Building2, MapPin, Phone, LogOut } from "lucide-react";
import Link from "next/link";

export default async function ConsultorioContaPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") redirect("/login");

  const consultorio = await prisma.consultorio.findUnique({
    where: { userId: session.id },
    include: { user: { select: { email: true } } },
  });
  if (!consultorio) redirect("/login");

  return (
    <div>
      <TopBar titulo="A minha conta" back="/consultorio" />

      <div className="px-4 py-6 space-y-4">
        {/* Perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center">
              <Building2 size={28} strokeWidth={1.5} className="text-[#00A99D]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{consultorio.nome}</p>
              <p className="text-gray-400 text-sm">{consultorio.user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            {consultorio.zonaLuanda && (
              <p className="flex items-center gap-2">
                <MapPin size={15} strokeWidth={1.75} className="text-[#00A99D]" />
                {consultorio.zonaLuanda}, Luanda
              </p>
            )}
            {consultorio.morada && (
              <p className="flex items-center gap-2">
                <MapPin size={15} strokeWidth={1.75} className="text-gray-400" />
                {consultorio.morada}
              </p>
            )}
            {consultorio.contacto && (
              <p className="flex items-center gap-2">
                <Phone size={15} strokeWidth={1.75} className="text-[#00A99D]" />
                {consultorio.contacto}
              </p>
            )}
          </div>
        </div>

        {/* Acções */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          <Link href="/consultorio/salas" className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-gray-700">As minhas salas</span>
            <span className="text-gray-400 text-xs">→</span>
          </Link>
          <Link href="/consultorio/faturacao" className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-gray-700">Faturação e ganhos</span>
            <span className="text-gray-400 text-xs">→</span>
          </Link>
        </div>

        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-semibold py-4 rounded-2xl text-sm"
          >
            <LogOut size={16} strokeWidth={2} /> Terminar sessão
          </button>
        </form>
      </div>
    </div>
  );
}
