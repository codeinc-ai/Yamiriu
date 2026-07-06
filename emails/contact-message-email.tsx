import { Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";

export interface ContactMessageEmailProps {
  name: string;
  email: string;
  message: string;
}

/** Internal notification sent to the brand inbox when a visitor submits the
 * Contact page form. Not sent to the customer. */
export function ContactMessageEmail({
  name,
  email,
  message,
}: ContactMessageEmailProps) {
  return (
    <BrandEmailShell
      preview={`New contact form message from ${name}`}
      heading="New contact message"
    >
      <Text style={emailStyles.paragraph}>
        <strong>From:</strong> {name} ({email})
      </Text>
      <Text style={{ ...emailStyles.paragraph, whiteSpace: "pre-wrap" }}>
        {message}
      </Text>
    </BrandEmailShell>
  );
}

export default ContactMessageEmail;
