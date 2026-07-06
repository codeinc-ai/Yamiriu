import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Your account</h1>
      <p className="text-ink/70">
        Signed in as{" "}
        <span className="font-medium text-ink">{user?.email}</span>.
      </p>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
