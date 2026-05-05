import { getAuthSession } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { DisputaThread } from "@/components/disputa-thread";

export default async function DisputaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");

  return (
    <div>
      <TopBar titulo="Detalhe da disputa" back="/medico/disputas" />
      <div className="px-4 pt-4 pb-10">
        <DisputaThread disputaId={id} currentUserId={session.id} />
      </div>
    </div>
  );
}
