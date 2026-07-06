import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";
import {
  isSessionInvalidated,
  primeSessionWatermark,
} from "@/lib/session-invalidation";
import { isRole } from "@/lib/rbac";

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

const providers: NextAuthConfig["providers"] = [];

// Google is edge-safe and only registered when configured. NextAuth applies
// state + PKCE checks by default, satisfying OAuth CSRF protection (S-007).
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  );
}

/**
 * Edge-safe Auth.js config shared by proxy.ts (Edge) and the full node config
 * in auth.ts. Contains NO static imports of the DB, bcrypt, or the Credentials
 * provider — those are node-only and live in auth.ts. Any DB access in the jwt
 * callback is dynamically imported and guarded to run only at sign-in (which
 * happens in the node route handler, never in Edge middleware).
 */
export const authConfig = {
  secret: env.NEXTAUTH_SECRET,
  trustHost: true,
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  cookies: {
    // httpOnly + Secure + SameSite=Strict session cookie (PRD S-003).
    // Only the session token is Strict; NextAuth's own state/pkce/csrf cookies
    // keep their Lax defaults so the OAuth redirect flow still works.
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    // Reject Google sign-ins whose email Google hasn't verified — prevents
    // account-linking takeover when we key users by email.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Sign-in path (runs in the node route handler, not Edge middleware).
        let id = user.id ?? "";
        let role = user.role;
        let sessionsValidFrom: Date | undefined = user.sessionsValidFrom
          ? new Date(user.sessionsValidFrom)
          : undefined;

        // OAuth users arrive without a role — resolve/create in our DB.
        if (!role) {
          const { getOrCreateOAuthUser } = await import("@/lib/auth-user");
          const dbUser = await getOrCreateOAuthUser({
            email: user.email ?? "",
            name: user.name,
            image: user.image,
          });
          id = dbUser.id;
          role = dbUser.role;
          sessionsValidFrom = dbUser.sessionsValidFrom;
        }

        token.id = id;
        token.role = role;
        token.loginAt = Date.now();

        if (id && sessionsValidFrom) {
          await primeSessionWatermark(id, sessionsValidFrom.getTime());
        }
        return token;
      }

      // Subsequent requests: enforce stateless revocation (S-004, S-008).
      if (token.id && typeof token.loginAt === "number") {
        if (await isSessionInvalidated(token.id, token.loginAt)) {
          return null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (isRole(token.role)) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
