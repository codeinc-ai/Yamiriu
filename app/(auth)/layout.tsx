import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-ink"
          >
            Yamiriu
          </Link>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white/70 p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
