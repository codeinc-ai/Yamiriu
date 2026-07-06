"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/account";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Optimistic profile edit (PRD WF-010) — the input is authoritative the
 * instant the user hits Save; a failed request rolls it back to the last
 * confirmed value rather than leaving a stale/ambiguous field. */
export function ProfileForm({ initialName }: { initialName: string }) {
  const [confirmedName, setConfirmedName] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const attempted = name;
    startTransition(async () => {
      const result = await updateProfile({ name: attempted });
      if (!result.ok) {
        setName(confirmedName);
        toast.error(result.error ?? "Couldn't update your profile.");
        return;
      }
      setConfirmedName(attempted);
      toast.success("Profile updated.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <Button
        type="submit"
        loading={pending}
        disabled={name === confirmedName || name.trim().length === 0}
        className="self-start"
      >
        Save
      </Button>
    </form>
  );
}
