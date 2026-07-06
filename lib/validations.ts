import { z } from "zod";

/** Shared auth form/action schemas (validated client-side AND server-side). */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

// Password policy: min 8, at least one letter and one number (WF-001 weak-password guard).
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.") // bcrypt truncates beyond 72 bytes
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Checkout schemas (PRD 4.6, 6.3, FR-010). */

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

// Permissive on purpose — not the focus of correctness for this feature.
const pakistaniPhoneSchema = z
  .string()
  .trim()
  .regex(/^(\+92|0)[0-9\s-]{9,13}$/, "Enter a valid Pakistani phone number.");

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  phone: pakistaniPhoneSchema,
  addressLine1: z.string().trim().min(1, "Address is required.").max(200, "Address is too long."),
  addressLine2: z.string().trim().max(200, "Address is too long.").optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required.").max(100, "City is too long."),
  province: z.enum(PAKISTAN_PROVINCES),
  postalCode: z.string().trim().min(1, "Postal code is required.").max(10, "Postal code is too long."),
});
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const paymentMethodSchema = z.enum(["jazzcash", "easypaisa", "bank_transfer", "cod", "card"]);

export const cartItemInputSchema = z.object({
  variantId: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(20),
  outfitGroupId: z.string().trim().min(1).optional(),
});
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const placeOrderSchema = z
  .object({
    items: z.array(cartItemInputSchema).min(1, "Your cart is empty.").max(50),
    addressId: z.string().trim().min(1).optional(),
    address: shippingAddressSchema.optional(),
    saveAddress: z.boolean().default(false),
    paymentMethod: paymentMethodSchema,
    discountCode: z.string().trim().max(50).optional().or(z.literal("")),
    giftCardCode: z.string().trim().max(50).optional().or(z.literal("")),
    guestEmail: emailSchema.optional(),
  })
  .refine((data) => data.addressId || data.address, {
    message: "Provide a shipping address.",
    path: ["address"],
  });
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

/** Admin product/variant schemas (PRD 4.8.3). */

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(200, "Slug is too long.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.");

export const productCategorySchema = z.enum(["men", "women", "kids"]);
export const productItemTypeSchema = z.enum(["top", "bottom", "shoes", "accessory", "jacket"]);

export const productVariantInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  size: z.string().trim().min(1, "Size is required.").max(20),
  color: z.string().trim().min(1, "Color is required.").max(40),
  stock: z.number().int().min(0, "Stock can't be negative.").max(100000),
  sku: z.string().trim().min(1, "SKU is required.").max(60),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;

export const productFormSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, "Name is required.").max(150, "Name is too long."),
  slug: slugSchema,
  description: z.string().trim().max(5000, "Description is too long.").optional().or(z.literal("")),
  price: z
    .number()
    .positive("Price must be greater than zero.")
    .max(10_000_000, "Price is too large."),
  category: productCategorySchema,
  itemType: productItemTypeSchema.optional().or(z.literal("")),
  images: z.array(z.string().trim().url()).max(6).optional(),
  hasModel: z.boolean(),
  modelUrl: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean(),
  variants: z.array(productVariantInputSchema).max(60).optional(),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

/** Admin discount/gift-card schemas (PRD 4.8.9). */

const discountCodeSchema = z
  .string()
  .trim()
  .min(3, "Code must be at least 3 characters.")
  .max(50, "Code is too long.")
  .transform((v) => v.toUpperCase());

// RHF's `valueAsNumber` turns a cleared number input into NaN rather than
// undefined, which a plain `z.number().optional()` rejects — coerce it back
// to undefined first so leaving an optional number field blank validates.
// Cast keeps the schema's static input/output types as `number | undefined`
// (matching what RHF's resolver expects) rather than preprocess's `unknown`.
function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
    schema.optional()
  ) as unknown as z.ZodOptional<z.ZodNumber>;
}

export const discountFormSchema = z.object({
  id: z.string().trim().min(1).optional(),
  code: discountCodeSchema,
  type: z.enum(["percent", "flat"]),
  value: z.number().positive("Value must be greater than zero."),
  minOrderValue: optionalNumber(z.number().nonnegative()),
  expiresAt: z.string().trim().optional().or(z.literal("")),
  usageLimit: optionalNumber(z.number().int().positive()),
});
export type DiscountFormInput = z.infer<typeof discountFormSchema>;

export const giftCardIssueSchema = z.object({
  initialBalance: z.number().positive("Amount must be greater than zero.").max(1_000_000),
  issuedToEmail: emailSchema.optional().or(z.literal("")),
  expiresAt: z.string().trim().optional().or(z.literal("")),
});
export type GiftCardIssueInput = z.infer<typeof giftCardIssueSchema>;

/** Admin content schemas (PRD 4.8.8). */

export const bannerFormSchema = z.object({
  id: z.string().trim().min(1).optional(),
  imageUrl: z.string().trim().url("Provide a valid image URL."),
  linkUrl: z.string().trim().url().optional().or(z.literal("")),
  title: z.string().trim().max(150).optional().or(z.literal("")),
  active: z.boolean(),
  sortOrder: z.number().int(),
});
export type BannerFormInput = z.infer<typeof bannerFormSchema>;

export const lookbookFormSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, "Title is required.").max(150),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Provide a valid image URL."),
  relatedProductIds: z.array(z.string().trim().min(1)).max(20).optional(),
  published: z.boolean(),
});
export type LookbookFormInput = z.infer<typeof lookbookFormSchema>;

export const journalFormSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, "Title is required.").max(150),
  slug: slugSchema,
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required.").max(20000),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  published: z.boolean(),
});
export type JournalFormInput = z.infer<typeof journalFormSchema>;

/** Admin team schema (PRD 4.8.5, owner-only). */
export const teamInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["owner", "admin", "product_manager", "order_fulfillment", "support"]),
});
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters.")
    .max(2000, "Message is too long."),
  // Honeypot: real visitors never see or fill this field; bots that
  // auto-fill every input will, so any non-empty value marks it as spam.
  company: z.string().max(0, "").optional().or(z.literal("")),
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;
