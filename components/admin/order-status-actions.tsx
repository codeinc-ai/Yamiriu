"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  transitionOrderStatus,
  confirmBankTransferPayment,
  generateShipment,
} from "@/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ALLOWED_ORDER_TRANSITIONS, MONEY_MOVEMENT_TARGETS } from "@/lib/order-transitions";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export function OrderStatusActions({
  orderId,
  status,
  paymentMethod,
  trackingNumber,
  canWrite,
  canRefund,
}: {
  orderId: string;
  status: string;
  paymentMethod: string;
  trackingNumber: string | null;
  canWrite: boolean;
  canRefund: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  function runTransition(targetStatus: string) {
    startTransition(async () => {
      const result = await transitionOrderStatus({ orderId, targetStatus });
      setPendingTarget(null);
      if (result.ok) {
        toast.success(`Order moved to ${ORDER_STATUS_LABELS[targetStatus] ?? targetStatus}.`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function runBankTransferConfirm() {
    startTransition(async () => {
      const result = await confirmBankTransferPayment(orderId);
      if (result.ok) {
        toast.success("Payment confirmed.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function runGenerateShipment() {
    startTransition(async () => {
      const result = await generateShipment(orderId);
      if (result.ok) {
        toast.success("Shipment created.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  const nextStatuses = (ALLOWED_ORDER_TRANSITIONS[status] ?? []).filter(
    (target) => !MONEY_MOVEMENT_TARGETS.has(target) || canRefund
  );

  if (!canWrite && nextStatuses.length === 0 && !(paymentMethod === "bank_transfer" && status === "pending_payment")) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canWrite && paymentMethod === "bank_transfer" && status === "pending_payment" ? (
        <Button type="button" size="sm" loading={isPending} onClick={runBankTransferConfirm}>
          Confirm bank transfer
        </Button>
      ) : null}

      {canWrite && status === "processing" && !trackingNumber ? (
        <Button type="button" size="sm" variant="secondary" loading={isPending} onClick={runGenerateShipment}>
          Generate shipment
        </Button>
      ) : null}

      {nextStatuses.map((target) => (
        <Button
          key={target}
          type="button"
          size="sm"
          variant={MONEY_MOVEMENT_TARGETS.has(target) ? "destructive" : "secondary"}
          onClick={() => setPendingTarget(target)}
        >
          Mark {ORDER_STATUS_LABELS[target] ?? target}
        </Button>
      ))}

      <ConfirmDialog
        open={pendingTarget !== null}
        onClose={() => setPendingTarget(null)}
        onConfirm={() => pendingTarget && runTransition(pendingTarget)}
        title={`Mark this order as ${pendingTarget ? (ORDER_STATUS_LABELS[pendingTarget] ?? pendingTarget) : ""}?`}
        description={
          pendingTarget && MONEY_MOVEMENT_TARGETS.has(pendingTarget)
            ? "This restocks the order's items and cannot be undone."
            : undefined
        }
        confirmLabel="Confirm"
        variant={pendingTarget && MONEY_MOVEMENT_TARGETS.has(pendingTarget) ? "destructive" : "primary"}
        loading={isPending}
      />
    </div>
  );
}
