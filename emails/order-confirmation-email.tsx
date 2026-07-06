import { Column, Link, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";
import { formatPkr } from "@/lib/format";
import { BANK_TRANSFER_DETAILS } from "@/lib/bank-details";
import { env } from "@/lib/env";

export interface OrderConfirmationEmailItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  priceAtPurchase: string;
}

export interface OrderConfirmationEmailProps {
  orderNumber: string;
  status: "confirmed" | "pending_review" | "pending_payment";
  paymentMethod: "jazzcash" | "easypaisa" | "bank_transfer" | "cod" | "card";
  items: OrderConfirmationEmailItem[];
  subtotal: string;
  discountAmount: string;
  shippingCost: string;
  total: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province?: string | null;
  };
}

const rowLabel = { ...emailStyles.paragraph, margin: 0, color: "#6b6e4c" };
const rowValue = { ...emailStyles.paragraph, margin: 0, textAlign: "right" as const };

function statusNote(
  status: OrderConfirmationEmailProps["status"],
  paymentMethod: OrderConfirmationEmailProps["paymentMethod"],
  total: string
) {
  if (paymentMethod === "cod") {
    if (status === "pending_review") {
      return "Your order is being reviewed by our team before it's confirmed — we'll be in touch shortly.";
    }
    return `Your order is confirmed. Please have ${formatPkr(total)} ready for the courier on delivery.`;
  }
  if (paymentMethod === "bank_transfer") {
    return "Please transfer the total below to the account details listed and we'll confirm your order once it's received.";
  }
  return "Complete your payment to confirm this order. You can find the payment link in your browser, or contact us if you need it resent.";
}

export function OrderConfirmationEmail({
  orderNumber,
  status,
  paymentMethod,
  items,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  const hasDiscount = Number(discountAmount) > 0;

  return (
    <BrandEmailShell
      preview={`Order ${orderNumber} received — thank you for shopping Yamiriu`}
      heading={`Order ${orderNumber}`}
    >
      <Text style={emailStyles.paragraph}>
        Thank you for your order. {statusNote(status, paymentMethod, total)}
      </Text>

      {paymentMethod === "bank_transfer" ? (
        <Section style={{ margin: "16px 0" }}>
          <Text style={{ ...emailStyles.paragraph, marginBottom: 4 }}>
            <strong>Bank:</strong> {BANK_TRANSFER_DETAILS.bankName}
          </Text>
          <Text style={{ ...emailStyles.paragraph, marginBottom: 4 }}>
            <strong>Account title:</strong> {BANK_TRANSFER_DETAILS.accountTitle}
          </Text>
          <Text style={{ ...emailStyles.paragraph, marginBottom: 4 }}>
            <strong>Account number:</strong> {BANK_TRANSFER_DETAILS.accountNumber}
          </Text>
          <Text style={emailStyles.paragraph}>
            <strong>IBAN:</strong> {BANK_TRANSFER_DETAILS.iban}
          </Text>
        </Section>
      ) : null}

      <Section style={{ margin: "20px 0" }}>
        {items.map((item, i) => (
          <Row key={i} style={{ marginBottom: 8 }}>
            <Column>
              <Text style={{ ...emailStyles.paragraph, margin: 0 }}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={{ ...rowLabel, fontSize: 12 }}>
                {item.size}, {item.color}
              </Text>
            </Column>
            <Column align="right">
              <Text style={rowValue}>
                {formatPkr(Number(item.priceAtPurchase) * item.quantity)}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Section>
        <Row>
          <Column>
            <Text style={rowLabel}>Subtotal</Text>
          </Column>
          <Column align="right">
            <Text style={rowValue}>{formatPkr(subtotal)}</Text>
          </Column>
        </Row>
        {hasDiscount ? (
          <Row>
            <Column>
              <Text style={rowLabel}>Discount</Text>
            </Column>
            <Column align="right">
              <Text style={rowValue}>-{formatPkr(discountAmount)}</Text>
            </Column>
          </Row>
        ) : null}
        <Row>
          <Column>
            <Text style={rowLabel}>Shipping</Text>
          </Column>
          <Column align="right">
            <Text style={rowValue}>
              {Number(shippingCost) === 0 ? "Free" : formatPkr(shippingCost)}
            </Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text style={{ ...emailStyles.paragraph, margin: "8px 0 0", fontWeight: 700 }}>
              Total
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{ ...rowValue, margin: "8px 0 0", fontWeight: 700 }}
            >
              {formatPkr(total)}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={{ ...emailStyles.paragraph, marginTop: 20 }}>
        <strong>Shipping to:</strong>
        <br />
        {shippingAddress.fullName}
        <br />
        {shippingAddress.addressLine1}
        {shippingAddress.addressLine2 ? <>, {shippingAddress.addressLine2}</> : null}
        <br />
        {shippingAddress.city}
        {shippingAddress.province ? `, ${shippingAddress.province}` : ""}
      </Text>

      <Text style={{ ...emailStyles.paragraph, marginTop: 20 }}>
        You can check your order&apos;s status anytime — no account needed.
      </Text>
      <Link
        href={`${env.NEXT_PUBLIC_APP_URL}/track-order`}
        style={emailStyles.buttonStyle}
      >
        Track your order
      </Link>
    </BrandEmailShell>
  );
}

export default OrderConfirmationEmail;
