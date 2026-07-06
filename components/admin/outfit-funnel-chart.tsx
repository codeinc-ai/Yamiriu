import type { OutfitFunnelStep } from "@/lib/queries/admin-analytics";

export function OutfitFunnelChart({ steps }: { steps: OutfitFunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <div key={step.step} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-sm text-ink/70">{step.step}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full rounded-full bg-terracotta/70"
              style={{ width: `${Math.max(2, (step.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-medium text-ink">{step.count}</span>
        </div>
      ))}
    </div>
  );
}
