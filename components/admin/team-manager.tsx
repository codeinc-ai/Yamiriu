"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { inviteTeamMember, deactivateTeamMember, reactivateTeamMember } from "@/actions/admin/team";
import { updateUserRole } from "@/actions/team";
import { teamInviteSchema, type TeamInviteInput } from "@/lib/validations";
import { ROLES, type Role } from "@/lib/rbac";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import type { AdminStaffRow, AdminPendingInviteRow } from "@/lib/queries/admin-team";

const ASSIGNABLE_ROLES = ROLES.filter((r) => r !== "customer");

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  product_manager: "Product Manager",
  order_fulfillment: "Order Fulfillment",
  support: "Support",
  customer: "Customer",
};

function InviteForm({ onDone }: { onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamInviteInput>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: { email: "", role: "support" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await inviteTeamMember(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    toast.success("Invite sent.");
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <Select label="Role" error={errors.role?.message} {...register("role")}>
        {ASSIGNABLE_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Send invite
        </Button>
      </div>
    </form>
  );
}

export function TeamManager({
  staff,
  pendingInvites,
}: {
  staff: AdminStaffRow[];
  pendingInvites: AdminPendingInviteRow[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function closeInvite() {
    setInviteOpen(false);
    router.refresh();
  }

  async function handleRoleChange(userId: string, role: Role) {
    setBusy(true);
    const result = await updateUserRole({ userId, role });
    setBusy(false);
    if (result.ok) {
      toast.success(result.message ?? "Role updated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  async function confirmDeactivate() {
    if (!pendingDeactivateId) return;
    setBusy(true);
    const result = await deactivateTeamMember(pendingDeactivateId);
    setBusy(false);
    setPendingDeactivateId(null);
    if (result.ok) {
      toast.success("Team member deactivated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  async function handleReactivate(userId: string) {
    setBusy(true);
    const result = await reactivateTeamMember(userId);
    setBusy(false);
    if (result.ok) {
      toast.success("Team member reactivated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setInviteOpen(true)}>
          Invite team member
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-ink">{member.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{member.email}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={member.role}
                    disabled={busy || member.role === "owner"}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                    className="h-9 rounded-md border border-ink/20 bg-white px-2 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={member.isActive ? "olive" : "terracotta"}>
                    {member.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {member.role !== "owner" ? (
                    member.isActive ? (
                      <button
                        type="button"
                        className="text-ink/60 hover:text-red-600"
                        onClick={() => setPendingDeactivateId(member.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="font-medium text-terracotta hover:underline"
                        onClick={() => handleReactivate(member.id)}
                      >
                        Reactivate
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingInvites.length > 0 ? (
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-lg text-ink">Pending invites</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between">
                <span className="text-ink/80">{invite.email}</span>
                <Badge variant="neutral">{ROLE_LABELS[invite.role as Role] ?? invite.role}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite team member">
        {inviteOpen ? <InviteForm onDone={closeInvite} /> : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeactivateId !== null}
        onClose={() => setPendingDeactivateId(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate this team member?"
        description="They won't be able to sign in until reactivated."
        confirmLabel="Deactivate"
        loading={busy}
      />
    </div>
  );
}
