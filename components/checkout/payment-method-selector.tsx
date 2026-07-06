import type { PaymentMethod } from "@/lib/payments";
import { formatPkr } from "@/lib/format";
import { COD_MAX_ORDER_VALUE } from "@/lib/checkout-config";
import { cn } from "@/lib/utils";

const METHODS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: "cod", label: "Cash on Delivery", description: "Pay in cash when your order arrives." },
  { value: "bank_transfer", label: "Bank Transfer", description: "Transfer the total to our bank account; we confirm once received." },
  { value: "jazzcash", label: "JazzCash", description: "Pay with your JazzCash mobile wallet." },
  { value: "easypaisa", label: "Easypaisa", description: "Pay with your Easypaisa mobile wallet." },
  { value: "card", label: "Card", description: "Pay by debit or credit card." },
];

export function PaymentMethodSelector({
  value,
  onChange,
  codAvailable,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  codAvailable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {METHODS.map((method) => {
        const disabled = method.value === "cod" && !codAvailable;
        const selected = value === method.value;
        return (
          <label
            key={method.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors",
              disabled
                ? "cursor-not-allowed border-ink/10 opacity-50"
                : selected
                  ? "border-terracotta bg-terracotta/[0.04]"
                  : "border-ink/15 hover:border-ink/30"
            )}
          >
            <input
              type="radio"
              name="payment-method"
              className="mt-1"
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(method.value)}
            />
            <div>
              <p className="font-medium text-ink">{method.label}</p>
              <p className="mt-0.5 text-ink/70">
                {disabled
                  ? `Not available for orders over ${formatPkr(COD_MAX_ORDER_VALUE)}.`
                  : method.description}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
