"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { emailSchema } from "@/lib/validations";
import { trackOrder, type TrackOrderResult } from "@/actions/track-order";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { formatPkr } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

const trackOrderFormSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required."),
  email: emailSchema,
});

type FormValues = z.infer<typeof trackOrderFormSchema>;

export function TrackOrderForm() {
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(trackOrderFormSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    const response = await trackOrder(values);
    setResult(response);
  });

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Order number"
          type="text"
          placeholder="YAM-XXXXXX"
          error={errors.orderNumber?.message}
          {...register("orderNumber")}
        />
        <Input
          label="Email used at checkout"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Track order
        </Button>
      </form>

      {result && !result.ok ? (
        <FormAlert variant="error">{result.error}</FormAlert>
      ) : null}

      {result?.ok && result.order ? (
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xl text-ink">
              {result.order.orderNumber}
            </p>
            <span className="rounded-full bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta">
              {ORDER_STATUS_LABELS[result.order.status] ?? result.order.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Placed{" "}
            {new Date(result.order.createdAt).toLocaleDateString("en-PK", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>

          {result.order.trackingNumber ? (
            <p className="mt-3 text-sm text-ink/80">
              Tracking number:{" "}
              <span className="font-medium text-ink">
                {result.order.trackingNumber}
              </span>
              {result.order.courierProvider
                ? ` (${result.order.courierProvider})`
                : ""}
            </p>
          ) : null}

          <ul className="mt-4 divide-y divide-ink/10 border-t border-ink/10">
            {result.order.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="text-ink">
                  {item.quantity}× {item.productName}{" "}
                  <span className="text-ink/60">
                    ({item.size}, {item.color})
                  </span>
                </span>
                <span className="text-ink/70">
                  {formatPkr(Number(item.priceAtPurchase) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-3 text-sm font-semibold text-ink">
            <span>Total</span>
            <span>{formatPkr(result.order.total)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
