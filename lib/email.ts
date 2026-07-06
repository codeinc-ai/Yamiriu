import "server-only";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { CONTACT_INBOX_EMAIL } from "@/lib/site-config";
import { VerificationEmail } from "@/emails/verification-email";
import { PasswordResetEmail } from "@/emails/password-reset-email";
import { ContactMessageEmail } from "@/emails/contact-message-email";
import {
  OrderConfirmationEmail,
  type OrderConfirmationEmailProps,
} from "@/emails/order-confirmation-email";
import {
  OrderShippedEmail,
  type OrderShippedEmailProps,
} from "@/emails/order-shipped-email";
import { TeamInviteEmail, type TeamInviteEmailProps } from "@/emails/team-invite-email";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM = env.EMAIL_FROM ?? "Yamiriu <noreply@yamiriu.com>";

async function send(to: string, subject: string, html: string, text: string) {
  if (!resend) {
    // Dev fallback: no Resend key — log so flows remain testable locally.
    console.info(
      `[email] (dev, not sent) To: ${to} | Subject: ${subject}\n${text}`
    );
    return;
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("[email] Resend send failed:", error);
    throw new Error("Failed to send email.");
  }
}

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  name?: string | null
): Promise<void> {
  const node = VerificationEmail({ verifyUrl, name });
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(to, "Confirm your email · Yamiriu", html, text);
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  name?: string | null
): Promise<void> {
  const node = PasswordResetEmail({ resetUrl, name });
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(to, "Reset your password · Yamiriu", html, text);
}

export async function sendContactMessageEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const node = ContactMessageEmail(input);
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(CONTACT_INBOX_EMAIL, `New message from ${input.name} · Yamiriu`, html, text);
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: OrderConfirmationEmailProps
): Promise<void> {
  const node = OrderConfirmationEmail(order);
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(to, `Order ${order.orderNumber} received · Yamiriu`, html, text);
}

export async function sendOrderShippedEmail(
  to: string,
  order: OrderShippedEmailProps
): Promise<void> {
  const node = OrderShippedEmail(order);
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(to, `Order ${order.orderNumber} has shipped · Yamiriu`, html, text);
}

export async function sendTeamInviteEmail(
  to: string,
  invite: TeamInviteEmailProps
): Promise<void> {
  const node = TeamInviteEmail(invite);
  const [html, text] = await Promise.all([
    render(node),
    render(node, { plainText: true }),
  ]);
  await send(to, "You're invited to the Yamiriu team", html, text);
}
