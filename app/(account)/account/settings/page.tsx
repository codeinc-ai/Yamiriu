import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-guards";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserAddresses } from "@/lib/queries/addresses";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { AddressBook } from "@/components/account/address-book";
import { SignOutEverywhereButton } from "@/components/account/sign-out-everywhere-button";
import { DeleteAccountSection } from "@/components/account/delete-account-section";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [dbUser, addresses] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, user.id) }),
    getUserAddresses(user.id),
  ]);
  if (!dbUser) return null;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl text-ink">Settings</h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink">Profile</h2>
        <ProfileForm initialName={dbUser.name ?? ""} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink">Password</h2>
        <ChangePasswordForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink">Address book</h2>
        <AddressBook initialAddresses={addresses} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink">Sessions</h2>
        <p className="text-sm text-ink/70">
          Signed in on this device. If you think another device might have access to your
          account, sign out everywhere and sign back in.
        </p>
        <div>
          <SignOutEverywhereButton />
        </div>
      </section>

      <section>
        <DeleteAccountSection email={dbUser.email} />
      </section>
    </div>
  );
}
