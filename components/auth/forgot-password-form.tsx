"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validations";
import { requestPasswordReset } from "@/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    // Enumeration-safe: the action always returns the same message.
    const result = await requestPasswordReset(values);
    setMessage(result.message ?? "Check your email for reset instructions.");
  });

  if (message) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert variant="success">{message}</FormAlert>
        <p className="text-center text-sm text-ink/70">
          <Link href="/sign-in" className="text-terracotta hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>
      <p className="text-center text-sm text-ink/70">
        <Link href="/sign-in" className="text-terracotta hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
