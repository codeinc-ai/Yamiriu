import type { Role } from "@/lib/rbac";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  /** The user object returned by the credentials `authorize` callback. */
  interface User {
    role?: Role;
    sessionsValidFrom?: Date | string | null;
  }
}

// JWT is defined in @auth/core/jwt (next-auth/jwt merely re-exports it), so the
// augmentation must target that module to merge correctly.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    /** ms epoch when this token was minted; compared to the invalidation watermark. */
    loginAt?: number;
  }
}
