import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth-guards";
import { canAccessAdmin } from "@/lib/rbac";

/** Shared chrome (Navbar + Footer) for the marketing and shop route groups. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar showAdminLink={canAccessAdmin(user)} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
