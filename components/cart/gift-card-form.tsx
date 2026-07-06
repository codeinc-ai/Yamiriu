"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AppliedGiftCard } from "@/actions/gift-cards";

export function GiftCardForm({
  applied,
  pending,
  error,
  onApply,
  onRemove,
}: {
  applied: AppliedGiftCard | null;
  pending: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-olive/30 bg-olive/10 px-3 py-2.5 text-sm">
        <span className="text-olive">
          Gift card <span className="font-semibold">{applied.code}</span> applied
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-olive underline-offset-2 hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) onApply(code.trim());
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Gift card code"
          aria-label="Gift card code"
          className="h-11 flex-1 rounded-md border border-ink/20 bg-white px-3 text-sm uppercase text-ink outline-none placeholder:normal-case placeholder:text-ink/40 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
        />
        <Button type="submit" variant="secondary" loading={pending}>
          Apply
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
