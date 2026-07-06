import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";

export interface PasswordResetEmailProps {
  resetUrl: string;
  name?: string | null;
}

export function PasswordResetEmail({ resetUrl, name }: PasswordResetEmailProps) {
  return (
    <BrandEmailShell
      preview="Reset your Yamiriu password"
      heading="Reset your password"
    >
      <Text style={emailStyles.paragraph}>
        {name ? `Hi ${name},` : "Hi,"} we received a request to reset your
        Yamiriu password. This link expires in 1 hour and can be used once.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={resetUrl} style={emailStyles.buttonStyle}>
          Reset password
        </Button>
      </Section>
      <Text style={emailStyles.paragraph}>
        Or paste this link into your browser:
      </Text>
      <Text style={emailStyles.muted}>{resetUrl}</Text>
      <Text style={emailStyles.paragraph}>
        If you didn&apos;t request this, no action is needed — your password
        stays the same.
      </Text>
    </BrandEmailShell>
  );
}

export default PasswordResetEmail;
