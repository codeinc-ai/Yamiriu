import type { SizeTable } from "@/lib/size-guide-data";

export function SizeGuideTable({ table }: { table: SizeTable }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="mb-2 text-left text-base font-semibold text-ink">
          {table.title}
        </caption>
        <thead>
          <tr className="border-b border-ink/10 text-ink/60">
            <th scope="col" className="py-2 pr-4 font-medium">
              Pakistan / Local
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              EU / Italian
            </th>
            <th scope="col" className="py-2 font-medium">
              {table.measurementLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.local} className="border-b border-ink/5 text-ink">
              <td className="py-2 pr-4 font-medium">{row.local}</td>
              <td className="py-2 pr-4">{row.eu}</td>
              <td className="py-2">{row.measurement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
