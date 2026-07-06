import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { evaluateAccess } from "@/lib/auth-access";
import { isRole } from "@/lib/rbac";

// Edge instance built from the edge-safe config only (no DB/bcrypt/Credentials).
const { auth } = NextAuth(authConfig);

const FORBIDDEN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>403 — Forbidden | Yamiriu</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f3ec;color:#17140f;font-family:ui-serif,Georgia,'Times New Roman',serif}main{text-align:center;padding:2rem}h1{font-size:3rem;margin:0 0 .5rem;letter-spacing:-0.02em}p{font-family:ui-sans-serif,system-ui,sans-serif;color:#6b6e4c;margin:0 0 1.5rem}a{font-family:ui-sans-serif,system-ui,sans-serif;color:#bc5b39;text-decoration:none;border-bottom:1px solid currentColor}</style></head><body><main><h1>403</h1><p>You don't have permission to view this page.</p><a href="/">Return home</a></main></body></html>`;

/**
 * Route protection (PRD S-001, S-002, FR-002). Optimistic check only — reads the
 * role from the signed session cookie, never the DB (Next 16 proxy guidance).
 * Server Actions and API handlers re-check the role again (Universal Rule 12).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const sessionUser = req.auth?.user;
  const user =
    sessionUser?.id && isRole(sessionUser.role)
      ? { id: sessionUser.id, role: sessionUser.role }
      : null;

  const decision = evaluateAccess({ pathname, user });

  if (decision.type === "redirect") {
    const signInUrl = new URL(decision.to, req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", decision.callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  if (decision.type === "forbid") {
    return new NextResponse(FORBIDDEN_HTML, {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
