import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getAuthSession } from "@/lib/api-auth";
import { getAccessibleModules } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthSession();
  if (!auth || auth.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { adminRole: true },
  });

  if (!user) {
    redirect("/admin/login");
  }

  const accessibleModules = await getAccessibleModules(auth.id, user.adminRole ?? null);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AdminNav accessibleModules={accessibleModules} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
