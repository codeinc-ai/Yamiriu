"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { requestReturn } from "@/actions/returns";

export function RequestReturnButton({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await requestReturn({ orderNumber, reason });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
      toast.success("Return requested. Our team will review it shortly.");
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Request Return
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a return"
        description="Tell us why you'd like to return this order."
      >
        {submitted ? (
          <p className="text-sm text-olive">Your return request has been submitted for review.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Textarea
              label="Reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Wrong size, changed my mind, item damaged…"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} loading={pending}>
                Submit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
