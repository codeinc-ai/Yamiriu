import { ORDER_TIMELINE_STAGES, getOrderTimelineStageIndex } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        This order was {status === "cancelled" ? "cancelled" : "refunded"}.
      </p>
    );
  }

  const currentIndex = getOrderTimelineStageIndex(status);

  return (
    <ol className="flex items-center">
      {ORDER_TIMELINE_STAGES.map((stage, index) => {
        const complete = index <= currentIndex;
        const isLast = index === ORDER_TIMELINE_STAGES.length - 1;
        return (
          <li key={stage.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium",
                  complete ? "bg-terracotta text-cream" : "bg-ink/10 text-ink/40"
                )}
              >
                {index + 1}
              </span>
              <span className={cn("text-xs font-medium", complete ? "text-ink" : "text-ink/40")}>
                {stage.label}
              </span>
            </div>
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn("mx-2 h-0.5 flex-1", index < currentIndex ? "bg-terracotta" : "bg-ink/10")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
