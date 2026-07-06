"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/actions/auth";

export function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      loading={pending}
      className="w-full"
      onClick={() =>
        startTransition(() => {
          void signInWithGoogle(callbackUrl);
        })
      }
    >
      Continue with Google
    </Button>
  );
}
