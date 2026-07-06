import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center"
    >
      <p className="font-display text-6xl text-terracotta">404</p>
      <h1 className="font-display text-2xl text-ink">
        This page has wandered off
      </h1>
      <p className="max-w-md text-ink/70">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <ButtonLink href="/">Return home</ButtonLink>
    </main>
  );
}
