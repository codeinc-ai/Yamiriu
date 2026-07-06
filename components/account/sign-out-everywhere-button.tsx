"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutEverywhere } from "@/actions/auth";
import { Button } from "@/components/ui/button";

/** Revokes every session including this one (S-008), so the client must
 * navigate itself afterward — signOutEverywhere deliberately doesn't
 * redirect (it's also used as a plain server action elsewhere). */
export function SignOutEverywhereButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOutEverywhere();
      router.push("/sign-in");
    });
  }

  return (
    <Button type="button" variant="secondary" loading={pending} onClick={handleClick}>
      Sign out from all devices
    </Button>
  );
}
