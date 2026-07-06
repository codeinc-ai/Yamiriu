import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-guards";
import { canAccessAdmin, ROLE_PERMISSIONS } from "@/lib/rbac";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

// Server-side staff gate in addition to proxy.ts (PRD S-001, S-002, CHECK 2/3).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/admin");
  if (!canAccessAdmin(user)) redirect("/");

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <AdminTopbar email={dbUser?.email ?? ""} role={user.role} />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:gap-12">
        <aside className="md:w-48 md:shrink-0">
          <AdminSidebarNav permissions={ROLE_PERMISSIONS[user.role]} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
