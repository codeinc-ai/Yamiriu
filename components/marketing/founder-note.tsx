/** Visible callout marking placeholder copy for the founders/legal to review
 * and replace before launch — deliberately shown on the live page (not just a
 * code comment) so it isn't missed during content handoff. */
export function FounderNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-6 rounded-lg border border-dashed border-gold/50 bg-gold/10 px-4 py-3 text-sm text-ink/80">
      <p className="font-medium text-ink">
        Placeholder copy — replace before launch
      </p>
      <p className="mt-1 text-ink/70">{children}</p>
    </aside>
  );
}
