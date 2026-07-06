import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "@/lib/auth.config";
import { signInSchema } from "@/lib/validations";

// Bcrypt hash of a random string, used to keep timing consistent for unknown
// emails (mitigates user enumeration via response timing).
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO3jTuC5j9jVSxW0h1mM3z4b1p7a9k8pS";

/**
 * Full (node) Auth.js instance. Adds the Credentials provider (needs bcrypt +
 * DB) on top of the edge-safe authConfig. Lockout/rate-limit/audit orchestration
 * lives in the sign-in Server Action; `authorize` only performs the raw
 * credential check and returns the user or null.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: and(eq(users.email, email), isNull(users.deletedAt)),
        });

        // Constant-ish work whether or not the user exists / has a password.
        if (!user?.passwordHash) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Banned customers / deactivated staff can't sign in at all (PRD 4.8.4/4.8.7).
        if (!user.isActive) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          sessionsValidFrom: user.sessionsValidFrom,
        };
      },
    }),
  ],
});
