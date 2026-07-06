import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";

export interface VerificationEmailProps {
  verifyUrl: string;
  name?: string | null;
}

export function VerificationEmail({ verifyUrl, name }: VerificationEmailProps) {
  return (
    <BrandEmailShell
      preview="Confirm your email to finish setting up your Yamiriu account"
      heading="Confirm your email"
    >
      <Text style={emailStyles.paragraph}>
        {name ? `Welcome, ${name}.` : "Welcome."} Please confirm your email
        address to activate your Yamiriu account.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={verifyUrl} style={emailStyles.buttonStyle}>
          Confirm email
        </Button>
      </Section>
      <Text style={emailStyles.paragraph}>
        Or paste this link into your browser:
      </Text>
      <Text style={emailStyles.muted}>{verifyUrl}</Text>
    </BrandEmailShell>
  );
}

export default VerificationEmail;
