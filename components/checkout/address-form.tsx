import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { PAKISTAN_PROVINCES } from "@/lib/validations";
import type { CheckoutFormValues } from "./checkout-form-schema";

export function AddressForm({
  register,
  errors,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>["address"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        autoComplete="name"
        error={errors?.fullName?.message}
        {...register("address.fullName")}
      />
      <Input
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="03XX XXXXXXX"
        error={errors?.phone?.message}
        {...register("address.phone")}
      />
      <div className="sm:col-span-2">
        <Input
          label="Address line 1"
          autoComplete="address-line1"
          error={errors?.addressLine1?.message}
          {...register("address.addressLine1")}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Address line 2 (optional)"
          autoComplete="address-line2"
          error={errors?.addressLine2?.message}
          {...register("address.addressLine2")}
        />
      </div>
      <Input
        label="City"
        autoComplete="address-level2"
        error={errors?.city?.message}
        {...register("address.city")}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="address-province" className="text-sm font-medium text-ink">
          Province
        </label>
        <select
          id="address-province"
          defaultValue=""
          className="h-11 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
          {...register("address.province")}
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
        {errors?.province?.message ? (
          <p role="alert" className="text-sm text-red-600">
            {errors.province.message}
          </p>
        ) : null}
      </div>
      <Input
        label="Postal code"
        autoComplete="postal-code"
        error={errors?.postalCode?.message}
        {...register("address.postalCode")}
      />
    </div>
  );
}
