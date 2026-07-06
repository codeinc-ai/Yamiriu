"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { capture } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await subscribeToNewsletter({ email });
    setPending(false);
    if (result.ok) {
      capture("newsletter_signup");
      toast.success(result.message, { duration: 3000 });
      setEmail("");
    } else {
      toast.error(result.message, { duration: 5000 });
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex gap-2", className)} noValidate>
      <input
        type="email"
        required
        aria-label="Email address"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
      />
      <Button type="submit" loading={pending}>
        Subscribe
      </Button>
    </form>
  );
}
