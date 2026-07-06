"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { signUpSchema } from "@/lib/validations";
import { signUp } from "@/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { GoogleButton } from "./google-button";

type FormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(null);
    const result = await signUp(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSuccess(result.message ?? "Check your email to confirm your account.");
    reset();
  });

  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-in";

  if (success) {
    return <FormAlert variant="success">{success}</FormAlert>;
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/15" />
            <span className="text-xs uppercase tracking-wider text-ink/60">
              or
            </span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <GoogleButton callbackUrl={callbackUrl} />
        </>
      ) : null}

      <p className="text-center text-sm text-ink/70">
        Already have an account?{" "}
        <Link href={signInHref} className="text-terracotta hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
