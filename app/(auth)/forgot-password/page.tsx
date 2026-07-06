import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-ink">Reset your password</h1>
        <p className="text-sm text-ink/70">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </header>
      <ForgotPasswordForm />
    </div>
  );
}
