import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { sanitizeCallbackUrl } from "@/lib/auth-access";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
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
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="text-sm text-ink/70">Sign in to your Yamiriu account.</p>
      </header>
      <SignInForm
        callbackUrl={callbackUrl ? sanitizeCallbackUrl(callbackUrl) : undefined}
        googleEnabled={googleEnabled}
      />
    </div>
  );
}
