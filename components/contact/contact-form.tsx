"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { contactFormSchema } from "@/lib/validations";
import { submitContactForm } from "@/actions/contact";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

type FormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await submitContactForm(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSuccess(result.message ?? "Thanks — we'll be in touch soon.");
    reset();
  });

  if (success) {
    return <FormAlert variant="success">{success}</FormAlert>;
  }

  return (
    <div className="flex flex-col gap-5">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Textarea
          label="Message"
          error={errors.message?.message}
          {...register("message")}
        />
        {/* Honeypot — hidden from real users, visible to naive bots. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] top-auto size-px overflow-hidden"
          {...register("company")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send message
        </Button>
      </form>
    </div>
  );
}
