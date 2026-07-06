import { z } from "zod";
import { emailSchema, paymentMethodSchema, shippingAddressSchema } from "@/lib/validations";

const newAddressFieldsSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

/**
 * The checkout form covers two mutually-exclusive address inputs (saved
 * address book selection vs. a freshly-typed address) — `superRefine` only
 * validates the branch that's actually active, so the inactive one never
 * blocks submission with stale/empty-field errors.
 */
export function buildCheckoutFormSchema(isLoggedIn: boolean) {
  return z
    .object({
      addressMode: z.enum(["saved", "new"]),
      addressId: z.string().optional(),
      address: newAddressFieldsSchema,
      saveAddress: z.boolean(),
      paymentMethod: paymentMethodSchema,
      guestEmail: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.addressMode === "saved") {
        if (!data.addressId) {
          ctx.addIssue({ code: "custom", path: ["addressId"], message: "Select a saved address." });
        }
      } else {
        const parsed = shippingAddressSchema.safeParse(data.address);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            ctx.addIssue({ code: "custom", path: ["address", ...issue.path], message: issue.message });
          }
        }
      }

      if (!isLoggedIn) {
        const parsed = emailSchema.safeParse(data.guestEmail);
        if (!parsed.success) {
          ctx.addIssue({ code: "custom", path: ["guestEmail"], message: "Enter a valid email address." });
        }
      }
    });
}

export type CheckoutFormValues = z.infer<ReturnType<typeof buildCheckoutFormSchema>>;
