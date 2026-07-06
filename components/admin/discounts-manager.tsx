"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createDiscount, updateDiscount, deactivateDiscount } from "@/actions/admin/discounts";
import { discountFormSchema, type DiscountFormInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format";
import type { AdminDiscountRow } from "@/lib/queries/admin-discounts";

function DiscountForm({
  initial,
  onDone,
}: {
  initial?: AdminDiscountRow;
  onDone: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormInput>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          code: initial.code,
          type: initial.type as "percent" | "flat",
          value: Number(initial.value),
          minOrderValue: initial.minOrderValue ? Number(initial.minOrderValue) : undefined,
          expiresAt: initial.expiresAt ? initial.expiresAt.slice(0, 10) : "",
          usageLimit: initial.usageLimit ?? undefined,
        }
      : { code: "", type: "percent", value: 10 },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const action = initial ? updateDiscount : createDiscount;
    const result = await action(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(initial ? "Discount updated." : "Discount created.");
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <Input label="Code" error={errors.code?.message} {...register("code")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Type" error={errors.type?.message} {...register("type")}>
          <option value="percent">Percent</option>
          <option value="flat">Flat (PKR)</option>
        </Select>
        <Input
          label="Value"
          type="number"
          step="0.01"
          error={errors.value?.message}
          {...register("value", { valueAsNumber: true })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Min order value (optional)"
          type="number"
          step="0.01"
          error={errors.minOrderValue?.message}
          {...register("minOrderValue", { valueAsNumber: true })}
        />
        <Input
          label="Usage limit (optional)"
          type="number"
          error={errors.usageLimit?.message}
          {...register("usageLimit", { valueAsNumber: true })}
        />
      </div>
      <Input label="Expires (optional)" type="date" error={errors.expiresAt?.message} {...register("expiresAt")} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Save changes" : "Create discount"}
        </Button>
      </div>
    </form>
  );
}

export function DiscountsManager({
  discounts: initialDiscounts,
  canWrite,
}: {
  discounts: AdminDiscountRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [modalDiscount, setModalDiscount] = useState<AdminDiscountRow | "new" | null>(null);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  function close() {
    setModalDiscount(null);
    router.refresh();
  }

  async function confirmDeactivate() {
    if (!pendingDeactivateId) return;
    setDeactivating(true);
    const result = await deactivateDiscount(pendingDeactivateId);
    setDeactivating(false);
    setPendingDeactivateId(null);
    if (result.ok) {
      toast.success("Discount deactivated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalDiscount("new")}>
            New discount
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {initialDiscounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/60">
                  No discount codes yet.
                </td>
              </tr>
            ) : (
              initialDiscounts.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-ink">{d.code}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {d.type === "percent" ? `${d.value}%` : formatPkr(d.value)}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{d.minOrderValue ? formatPkr(d.minOrderValue) : "—"}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("en-PK") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">
                      {d.usedCount}
                      {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <div className="flex items-center gap-3">
                        <button type="button" className="font-medium text-terracotta hover:underline" onClick={() => setModalDiscount(d)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-ink/60 hover:text-red-600"
                          onClick={() => setPendingDeactivateId(d.id)}
                        >
                          Deactivate
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalDiscount !== null}
        onClose={() => setModalDiscount(null)}
        title={modalDiscount === "new" ? "New discount" : "Edit discount"}
      >
        {modalDiscount !== null ? (
          <DiscountForm initial={modalDiscount === "new" ? undefined : modalDiscount} onDone={close} />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeactivateId !== null}
        onClose={() => setPendingDeactivateId(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate this discount code?"
        description="Customers won't be able to use it anymore."
        confirmLabel="Deactivate"
        loading={deactivating}
      />
    </div>
  );
}
