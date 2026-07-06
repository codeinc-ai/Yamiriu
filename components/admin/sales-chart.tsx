import { formatPkr } from "@/lib/format";
import type { SalesDayPoint } from "@/lib/queries/admin-analytics";

/** Dependency-free SVG bar chart — the dataset is small (≤30 days) and this
 * is the only chart in the admin panel, so a charting library wasn't worth
 * the bundle cost. */
export function SalesChart({ data }: { data: SalesDayPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink/60">No sales in this period yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const width = 700;
  const height = 220;
  const barGap = 4;
  const barWidth = data.length > 0 ? width / data.length - barGap : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue by day">
      {data.map((point, i) => {
        const barHeight = Math.max(2, (point.revenue / max) * (height - 24));
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        return (
          <g key={point.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={2} className="fill-terracotta/70">
              <title>
                {point.date}: {formatPkr(point.revenue)} ({point.orderCount} orders)
              </title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
