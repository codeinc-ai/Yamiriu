"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { issueGiftCard, deactivateGiftCard } from "@/actions/admin/gift-cards";
import { giftCardIssueSchema, type GiftCardIssueInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format";
import type { AdminGiftCardRow } from "@/lib/queries/admin-gift-cards";

function IssueForm({ onDone }: { onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GiftCardIssueInput>({
    resolver: zodResolver(giftCardIssueSchema),
    defaultValues: { initialBalance: 1000 },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await issueGiftCard(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    setIssuedCode(result.code ?? null);
    toast.success("Gift card issued.");
  });

  if (issuedCode) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert variant="success">
          Gift card issued: <span className="font-mono font-semibold">{issuedCode}</span>
        </FormAlert>
        <div className="flex justify-end">
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <Input
        label="Amount (PKR)"
        type="number"
        step="0.01"
        error={errors.initialBalance?.message}
        {...register("initialBalance", { valueAsNumber: true })}
      />
      <Input
        label="Issued to email (optional)"
        type="email"
        error={errors.issuedToEmail?.message}
        {...register("issuedToEmail")}
      />
      <Input label="Expires (optional)" type="date" error={errors.expiresAt?.message} {...register("expiresAt")} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Issue gift card
        </Button>
      </div>
    </form>
  );
}

export function GiftCardsManager({
  giftCards: initialGiftCards,
  canWrite,
}: {
  giftCards: AdminGiftCardRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [issueOpen, setIssueOpen] = useState(false);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  function close() {
    setIssueOpen(false);
    router.refresh();
  }

  async function confirmDeactivate() {
    if (!pendingDeactivateId) return;
    setDeactivating(true);
    const result = await deactivateGiftCard(pendingDeactivateId);
    setDeactivating(false);
    setPendingDeactivateId(null);
    if (result.ok) {
      toast.success("Gift card deactivated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setIssueOpen(true)}>
            Issue gift card
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Issued to</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canWrite ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {initialGiftCards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/60">
                  No gift cards issued yet.
                </td>
              </tr>
            ) : (
              initialGiftCards.map((gc) => (
                <tr key={gc.id}>
                  <td className="px-4 py-3 font-mono font-medium text-ink">{gc.code}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {formatPkr(gc.balance)} / {formatPkr(gc.initialBalance)}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{gc.issuedToEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString("en-PK") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={gc.active ? "olive" : "neutral"}>{gc.active ? "Active" : "Deactivated"}</Badge>
                  </td>
                  {canWrite ? (
                    <td className="px-4 py-3">
                      {gc.active ? (
                        <button
                          type="button"
                          className="text-ink/60 hover:text-red-600"
                          onClick={() => setPendingDeactivateId(gc.id)}
                        >
                          Deactivate
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue gift card">
        {issueOpen ? <IssueForm onDone={close} /> : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeactivateId !== null}
        onClose={() => setPendingDeactivateId(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate this gift card?"
        description="It can no longer be redeemed at checkout."
        confirmLabel="Deactivate"
        loading={deactivating}
      />
    </div>
  );
}
