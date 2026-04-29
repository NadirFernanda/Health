import { getAuthSession } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { Bell } from "lucide-react";

export default async function ConsultorioNotificacoesPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") redirect("/login");

  return (
    <div>
      <TopBar titulo="Notificações" back="/consultorio" />
      <div className="px-4 py-10 flex flex-col items-center text-center">
        <Bell size={48} strokeWidth={1} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Ainda não tem notificações.</p>
      </div>
    </div>
  );
}
