import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-ink">Choose a new password</h1>
        <p className="text-sm text-ink/70">
          Set a new password for your Yamiriu account.
        </p>
      </header>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <FormAlert variant="error">
            This reset link is missing or invalid. Please request a new one.
          </FormAlert>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-terracotta hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      )}
    </div>
  );
}
