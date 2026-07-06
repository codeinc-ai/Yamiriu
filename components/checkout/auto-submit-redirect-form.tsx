"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";

/**
 * JazzCash/Easypaisa/PayFast all require a signed POST body to reach their
 * hosted checkout page — a plain redirect Location header can't carry that,
 * so this renders a hidden auto-submitting form instead.
 */
export function AutoSubmitRedirectForm({
  actionUrl,
  fields,
}: {
  actionUrl: string;
  fields: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <Spinner className="size-6" />
      <p className="text-ink/70">Redirecting you to complete your payment…</p>
      <form ref={formRef} method="POST" action={actionUrl} className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </div>
  );
}
