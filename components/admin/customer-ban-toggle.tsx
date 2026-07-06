"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { banCustomer, unbanCustomer } from "@/actions/admin/customers";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CustomerBanToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = isActive ? await banCustomer(userId) : await unbanCustomer(userId);
      setConfirmOpen(false);
      if (result.ok) {
        toast.success(isActive ? "Customer banned." : "Customer unbanned.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isActive ? "destructive" : "secondary"}
        onClick={() => setConfirmOpen(true)}
      >
        {isActive ? "Ban customer" : "Unban customer"}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={run}
        title={isActive ? "Ban this customer?" : "Unban this customer?"}
        description={
          isActive
            ? "They won't be able to sign in or place new orders until unbanned."
            : undefined
        }
        confirmLabel={isActive ? "Ban" : "Unban"}
        variant={isActive ? "destructive" : "primary"}
        loading={isPending}
      />
    </>
  );
}
