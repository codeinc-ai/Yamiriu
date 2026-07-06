import { Link, Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";

export interface OrderShippedEmailProps {
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string | null;
  courierProvider: string | null;
}

export function OrderShippedEmail({
  orderNumber,
  trackingNumber,
  trackingUrl,
  courierProvider,
}: OrderShippedEmailProps) {
  return (
    <BrandEmailShell
      preview={`Order ${orderNumber} is on its way`}
      heading={`Order ${orderNumber} has shipped`}
    >
      <Text style={emailStyles.paragraph}>
        Good news — your order is on its way{courierProvider ? ` with ${courierProvider}` : ""}.
      </Text>
      <Text style={emailStyles.paragraph}>
        <strong>Tracking number:</strong> {trackingNumber}
      </Text>
      {trackingUrl ? (
        <Link href={trackingUrl} style={emailStyles.buttonStyle}>
          Track your shipment
        </Link>
      ) : null}
    </BrandEmailShell>
  );
}

export default OrderShippedEmail;
