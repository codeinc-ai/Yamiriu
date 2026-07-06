import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { AccountSidebarNav } from "@/components/account/account-sidebar-nav";

// Server-side enforcement in addition to proxy.ts (PRD S-001, FR-002).
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/account");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        <aside className="md:w-48 md:shrink-0">
          <AccountSidebarNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
