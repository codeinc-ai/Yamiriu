import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export const metadata: Metadata = {
  title: "Accept Invite",
  robots: { index: false, follow: false },
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-ink">Join the Yamiriu team</h1>
        <p className="text-sm text-ink/70">Set a password to activate your staff account.</p>
      </header>
      <AcceptInviteForm token={token} />
    </div>
  );
}
