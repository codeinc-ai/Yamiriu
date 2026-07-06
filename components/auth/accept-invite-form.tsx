"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations";
import { acceptTeamInvite } from "@/actions/invite";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

const acceptInviteFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof acceptInviteFormSchema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(acceptInviteFormSchema), mode: "onBlur" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await acceptTeamInvite({ token, password: values.password });
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/sign-in"), 1500);
  });

  if (done) {
    return (
      <FormAlert variant="success">
        Your account has been created. Redirecting you to sign in…
      </FormAlert>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Set password and join
        </Button>
      </form>
    </div>
  );
}
