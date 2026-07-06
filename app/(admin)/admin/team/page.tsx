import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { hasRole } from "@/lib/rbac";
import { getStaffList, getPendingInvites } from "@/lib/queries/admin-team";
import { TeamManager } from "@/components/admin/team-manager";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default async function AdminTeamPage() {
  const user = await getCurrentUser();
  // Owner-only (PRD 4.8.5) — deliberately not just canAccessAdmin/team:read,
  // since admin explicitly lacks team management in the RBAC matrix.
  if (!user || !hasRole(user, ["owner"])) redirect("/admin");

  const [staff, pendingInvites] = await Promise.all([getStaffList(), getPendingInvites()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Team</h1>
      <TeamManager staff={staff} pendingInvites={pendingInvites} />
    </div>
  );
}
