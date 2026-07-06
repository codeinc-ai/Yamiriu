import { Link, Text } from "@react-email/components";
import * as React from "react";
import { BrandEmailShell, emailStyles } from "./shared";

export interface TeamInviteEmailProps {
  inviteUrl: string;
  role: string;
}

export function TeamInviteEmail({ inviteUrl, role }: TeamInviteEmailProps) {
  return (
    <BrandEmailShell preview="You've been invited to the Yamiriu team" heading="You're invited">
      <Text style={emailStyles.paragraph}>
        You&apos;ve been invited to join the Yamiriu admin team as <strong>{role}</strong>. Accept
        the invite below to set your password and get started.
      </Text>
      <Link href={inviteUrl} style={emailStyles.buttonStyle}>
        Accept invite
      </Link>
      <Text style={emailStyles.paragraph}>This invite link expires in 7 days.</Text>
    </BrandEmailShell>
  );
}

export default TeamInviteEmail;
