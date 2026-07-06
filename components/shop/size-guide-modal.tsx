"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

const ROWS = [
  { size: "XS / 4Y", chest: "34", waist: "27", hips: "35" },
  { size: "S / 6Y", chest: "36", waist: "29", hips: "37" },
  { size: "M", chest: "38", waist: "31", hips: "39" },
  { size: "L", chest: "40", waist: "33", hips: "41" },
  { size: "XL", chest: "42", waist: "35", hips: "43" },
];

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-terracotta underline-offset-2 hover:underline"
      >
        Size guide
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Size guide"
        description="Measurements in inches. If you're between sizes, we recommend sizing up."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-ink/60">
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Chest</th>
                <th className="py-2 pr-4 font-medium">Waist</th>
                <th className="py-2 font-medium">Hips</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.size} className="border-b border-ink/5 text-ink">
                  <td className="py-2 pr-4 font-medium">{row.size}</td>
                  <td className="py-2 pr-4">{row.chest}&Prime;</td>
                  <td className="py-2 pr-4">{row.waist}&Prime;</td>
                  <td className="py-2">{row.hips}&Prime;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
