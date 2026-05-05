import { getAuthSession } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  return <SupportClient />;
}
