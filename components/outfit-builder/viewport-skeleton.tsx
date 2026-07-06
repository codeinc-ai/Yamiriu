/** Humanoid silhouette shown while the avatar streams in (PRD 4.4 loading state). */
export function ViewportSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading avatar"
      className="flex h-full w-full items-center justify-center bg-cream"
    >
      <svg
        viewBox="0 0 100 200"
        className="h-2/3 text-ink/10 motion-safe:animate-pulse"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="50" cy="28" r="20" />
        <rect x="30" y="52" width="40" height="72" rx="18" />
        <rect x="9" y="58" width="16" height="62" rx="8" />
        <rect x="75" y="58" width="16" height="62" rx="8" />
        <rect x="31" y="126" width="17" height="66" rx="8" />
        <rect x="52" y="126" width="17" height="66" rx="8" />
      </svg>
    </div>
  );
}
