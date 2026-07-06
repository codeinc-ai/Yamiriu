import type { Address } from "@/db/schema";
import { cn } from "@/lib/utils";

export function AddressBook({
  addresses,
  selectedAddressId,
  mode,
  onSelectSaved,
  onSelectNew,
}: {
  addresses: Address[];
  selectedAddressId: string | null;
  mode: "saved" | "new";
  onSelectSaved: (addressId: string) => void;
  onSelectNew: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {addresses.map((address) => {
        const selected = mode === "saved" && selectedAddressId === address.id;
        return (
          <label
            key={address.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
              selected ? "border-terracotta bg-terracotta/[0.04]" : "border-ink/15 hover:border-ink/30"
            )}
          >
            <input
              type="radio"
              name="address-book"
              className="mt-1"
              checked={selected}
              onChange={() => onSelectSaved(address.id)}
            />
            <div>
              <p className="font-medium text-ink">
                {address.fullName}
                {address.label ? (
                  <span className="ml-2 text-xs font-normal text-ink/60">{address.label}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-ink/70">{address.phone}</p>
              <p className="text-ink/70">
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                {address.province ? `, ${address.province}` : ""}
              </p>
            </div>
          </label>
        );
      })}

      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors",
          mode === "new" ? "border-terracotta bg-terracotta/[0.04]" : "border-ink/15 hover:border-ink/30"
        )}
      >
        <input
          type="radio"
          name="address-book"
          className=""
          checked={mode === "new"}
          onChange={onSelectNew}
        />
        <span className="font-medium text-ink">Use a new address</span>
      </label>
    </div>
  );
}
