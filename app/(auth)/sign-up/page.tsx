import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { sanitizeCallbackUrl } from "@/lib/auth-access";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(sanitizeCallbackUrl(callbackUrl));

  const googleEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-ink">Create your account</h1>
        <p className="text-sm text-ink/70">
          Join Yamiriu — save outfits, track orders, and check out faster.
        </p>
      </header>
      <SignUpForm
        callbackUrl={callbackUrl ? sanitizeCallbackUrl(callbackUrl) : undefined}
        googleEnabled={googleEnabled}
      />
    </div>
  );
}
