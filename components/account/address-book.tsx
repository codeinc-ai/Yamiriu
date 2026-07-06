"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressActionResult,
} from "@/actions/addresses";
import { shippingAddressSchema, PAKISTAN_PROVINCES } from "@/lib/validations";
import type { Address } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";

const addressFormSchema = shippingAddressSchema.extend({
  label: z.string().trim().max(40).optional().or(z.literal("")),
});
type AddressFormValues = z.infer<typeof addressFormSchema>;

function AddressFormModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Address | null;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    values: editing
      ? {
          label: editing.label ?? "",
          fullName: editing.fullName,
          phone: editing.phone,
          addressLine1: editing.addressLine1,
          addressLine2: editing.addressLine2 ?? "",
          city: editing.city,
          province: (editing.province ?? "") as AddressFormValues["province"],
          postalCode: editing.postalCode ?? "",
        }
      : {
          label: "",
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          province: "" as AddressFormValues["province"],
          postalCode: "",
        },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result: AddressActionResult = editing
      ? await updateAddress({ ...values, id: editing.id })
      : await addAddress(values);

    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    toast.success(editing ? "Address updated." : "Address added.");
    reset();
    onSaved();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit address" : "Add a new address"}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
        <Input
          label="Label (optional)"
          placeholder="Home, Office…"
          error={errors.label?.message}
          {...register("label")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
          <Input
            label="Phone number"
            type="tel"
            placeholder="03XX XXXXXXX"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div className="sm:col-span-2">
            <Input label="Address line 1" error={errors.addressLine1?.message} {...register("addressLine1")} />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Address line 2 (optional)"
              error={errors.addressLine2?.message}
              {...register("addressLine2")}
            />
          </div>
          <Input label="City" error={errors.city?.message} {...register("city")} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="account-address-province" className="text-sm font-medium text-ink">
              Province
            </label>
            <select
              id="account-address-province"
              defaultValue=""
              className="h-11 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
              {...register("province")}
            >
              <option value="" disabled>
                Select a province
              </option>
              {PAKISTAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.province?.message ? (
              <p role="alert" className="text-sm text-red-600">
                {errors.province.message}
              </p>
            ) : null}
          </div>
          <Input label="Postal code" error={errors.postalCode?.message} {...register("postalCode")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? "Save changes" : "Add address"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    setFormOpen(false);
    setEditing(null);
    // Re-runs the server component that fetched `initialAddresses`, so the
    // list reflects the add/edit that just succeeded.
    router.refresh();
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setFormOpen(true);
  }

  async function handleSetDefault(address: Address) {
    const result = await setDefaultAddress({ id: address.id });
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't update your default address.");
      return;
    }
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === address.id })));
    toast.success("Default address updated.");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteAddress({ id: deleteTarget.id });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't remove that address.");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Address removed.");
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 ? (
        <p className="text-sm text-ink/60">You haven&apos;t saved any addresses yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-2 rounded-lg border border-ink/10 bg-white/60 p-4 text-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium text-ink">
                  {address.fullName}
                  {address.label ? <span className="ml-2 text-xs font-normal text-ink/60">{address.label}</span> : null}
                  {address.isDefault ? (
                    <Badge variant="olive" className="ml-2">
                      Default
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-0.5 text-ink/70">{address.phone}</p>
                <p className="text-ink/70">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                  {address.province ? `, ${address.province}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!address.isDefault ? (
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleSetDefault(address)}>
                    Set as default
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(address)}>
                  Edit
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteTarget(address)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="secondary" className="self-start" onClick={openAdd}>
        Add a new address
      </Button>

      <AddressFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        editing={editing}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this address?"
        description="This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
