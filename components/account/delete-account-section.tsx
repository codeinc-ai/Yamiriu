"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/account";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

/** Account deletion (PRD WF-010) — the confirm step requires typing the
 * account's own email exactly, checked both here (disables the button) and
 * again server-side (the only check that actually matters). */
export function DeleteAccountSection({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount({ confirmEmail });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      toast.success("Your account has been deleted.");
      router.push("/");
    });
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="font-display text-lg text-ink">Danger zone</h2>
      <p className="mt-2 text-sm text-ink/70">
        Deleting your account removes your personal information immediately. Your past orders
        are kept (anonymized) for accounting purposes, but everything else is gone — this can&apos;t
        be undone.
      </p>
      <Button
        type="button"
        variant="destructive"
        className="mt-4"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        description={`Type ${email} to confirm — this can't be undone.`}
      >
        <div className="flex flex-col gap-4">
          {error ? <FormAlert variant="error">{error}</FormAlert> : null}
          <Input
            label="Confirm email"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            autoComplete="off"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!matches}
              loading={pending}
              onClick={handleDelete}
            >
              Delete my account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
