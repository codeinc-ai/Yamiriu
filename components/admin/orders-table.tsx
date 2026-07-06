"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveCodOrder, rejectCodOrder } from "@/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { AdminOrderListItem } from "@/lib/queries/admin-orders";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  cod: "COD",
  card: "Card",
};

export function OrdersTable({
  items,
  canWrite,
}: {
  items: AdminOrderListItem[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function approve(orderId: string) {
    startTransition(async () => {
      const result = await approveCodOrder(orderId);
      if (result.ok) {
        toast.success("Order approved.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function reject(orderId: string) {
    startTransition(async () => {
      const result = await rejectCodOrder(orderId);
      if (result.ok) {
        toast.success("Order rejected and restocked.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Placed</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-ink/60">
                No orders found.
              </td>
            </tr>
          ) : (
            items.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/admin/orders/${order.orderNumber}`} className="hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">{order.customerEmail ?? "Guest"}</td>
                <td className="px-4 py-3 text-ink/70">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                <td className="px-4 py-3 text-ink/70">{formatPkr(order.total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ORDER_STATUS_BADGE_STYLES[order.status] ?? "bg-ink/10 text-ink/70"
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  {canWrite && order.status === "pending_review" ? (
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" loading={isPending} onClick={() => approve(order.id)}>
                        Approve
                      </Button>
                      <Button type="button" size="sm" variant="destructive" loading={isPending} onClick={() => reject(order.id)}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-terracotta hover:underline">
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
