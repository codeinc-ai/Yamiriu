import { SiteShell } from "@/components/layout/site-shell";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
