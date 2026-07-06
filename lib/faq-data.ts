export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How long does shipping take?",
    answer:
      "Orders within Pakistan typically arrive in 3-5 business days for major cities (Karachi, Lahore, Islamabad) and 5-7 business days elsewhere. You'll receive a WhatsApp and email update with your tracking number as soon as your order ships.",
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes — COD is available on orders under Rs 50,000. For larger orders, please pay via JazzCash, Easypaisa, bank transfer, or card at checkout.",
  },
  {
    question: "My JazzCash or Easypaisa payment failed — what do I do?",
    answer:
      "First, check whether the amount was deducted from your wallet — if it was, the payment usually confirms automatically within a few minutes. If your order still shows as pending after 30 minutes, message us on WhatsApp with your order number and we'll verify it manually.",
  },
  {
    question: "What's your return and exchange policy?",
    answer:
      "Unworn items with tags attached can be returned or exchanged within 7 days of delivery. See our full Returns & Exchanges page for the step-by-step process and non-returnable items.",
  },
  {
    question: "How does the Outfit Builder work?",
    answer:
      "Pick an avatar (men, women, or kids), then choose a top, bottom, shoes, and accessory to build a full look on a 3D model you can rotate and zoom. Only products with a 3D model available appear in the builder — everything else is still shop-able from the regular product pages. Add the whole outfit to your cart with one tap, or save it to your account to finish later.",
  },
  {
    question: "How do I know what size to order?",
    answer:
      "Every product page links to our Size Guide, which converts EU/Italian sizing to Pakistani sizing for tops, bottoms, and shoes across men's, women's, and kids' collections. If you're between sizes, we generally recommend sizing up.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes — use the Track Order page with your order number (from your confirmation email or WhatsApp message) and the email address used at checkout.",
  },
  {
    question: "Do you ship outside Pakistan?",
    answer:
      "Not yet — at launch we ship to addresses within Pakistan only. We're building toward international shipping in a future phase.",
  },
  {
    question: "How can I contact Yamiriu directly?",
    answer:
      "WhatsApp is the fastest way to reach us — see the click-to-chat link on our Contact page. You can also send a message through the contact form and we'll reply by email.",
  },
  {
    question: "I received the wrong item or a damaged product — what now?",
    answer:
      "We're sorry! Message us on WhatsApp within 48 hours of delivery with your order number and a photo of the item, and we'll arrange a replacement or refund at no extra cost to you.",
  },
];
