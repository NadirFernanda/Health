import { getAuthSession } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import MedicoDisputasClient from "./MedicoDisputasClient";

export default async function MedicoDisputasPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");
  return <MedicoDisputasClient userId={session.id} />;
}
