/** Shared navigation / footer / contact config for the marketing shell. */

export const NAV_CATEGORIES = [
  { label: "Men", href: "/for-men" },
  { label: "Women", href: "/for-women" },
  { label: "Kids", href: "/for-kids" },
] as const;

// Placeholder Pakistan WhatsApp business number — replace before launch.
export const WHATSAPP_NUMBER = "+92 300 0000000";
export const WHATSAPP_URL = "https://wa.me/923000000000";

// Inbox that receives Contact page submissions — replace before launch.
export const CONTACT_INBOX_EMAIL = "hello@yamiriu.com";

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/yamiriu" },
  { label: "TikTok", href: "https://tiktok.com/@yamiriu" },
  { label: "Facebook", href: "https://facebook.com/yamiriu" },
] as const;

export const PAYMENT_METHODS = [
  "JazzCash",
  "Easypaisa",
  "Bank Transfer",
  "COD",
  "Card",
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Men", href: "/for-men" },
      { label: "Women", href: "/for-women" },
      { label: "Kids", href: "/for-kids" },
      { label: "Outfit Builder", href: "/outfit-builder" },
      { label: "Lookbook", href: "/lookbook" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;
