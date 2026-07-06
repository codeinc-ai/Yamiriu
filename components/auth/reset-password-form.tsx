"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations";
import { resetPassword } from "@/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

const resetFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof resetFormSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(resetFormSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await resetPassword({ token, ...values });
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (field === "password" || field === "confirmPassword") {
            setError(field, { message });
          }
        }
      }
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  });

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert variant="success">
          Your password has been reset. You can now sign in.
        </FormAlert>
        <Link
          href="/sign-in"
          className="text-center text-sm text-terracotta hover:underline"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Reset password
        </Button>
      </form>
    </div>
  );
}
