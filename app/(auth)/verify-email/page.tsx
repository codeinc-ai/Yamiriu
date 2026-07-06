import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/actions/auth";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : { ok: false };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-ink">Email verification</h1>
      </header>
      {result.ok ? (
        <div className="flex flex-col gap-4">
          <FormAlert variant="success">
            Your email is confirmed. Welcome to Yamiriu.
          </FormAlert>
          <Link
            href="/sign-in"
            className="text-center text-sm text-terracotta hover:underline"
          >
            Continue to sign in
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FormAlert variant="error">
            This verification link is invalid or has expired.
          </FormAlert>
          <Link
            href="/sign-in"
            className="text-center text-sm text-terracotta hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
