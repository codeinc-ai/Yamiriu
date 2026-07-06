"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { signInSchema } from "@/lib/validations";
import { signInWithCredentials } from "@/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { GoogleButton } from "./google-button";

type FormValues = z.infer<typeof signInSchema>;

export function SignInForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signInWithCredentials({ ...values, callbackUrl });
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(result.redirectTo ?? "/account");
    router.refresh();
  });

  const signUpHref = callbackUrl
    ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-up";

  return (
    <div className="flex flex-col gap-5">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-1 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-terracotta hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
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
        New to Yamiriu?{" "}
        <Link href={signUpHref} className="text-terracotta hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
