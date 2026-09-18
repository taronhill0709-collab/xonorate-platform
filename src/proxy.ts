import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Deliberately uses the edge-safe authConfig (no adapter, no Node-only
// providers) rather than the full `@/auth` — see auth.config.ts for why.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isFamilyRoute = req.nextUrl.pathname.startsWith("/family");

  const needsSignIn =
    (isAdminRoute && req.auth?.user?.role !== "admin") ||
    (isFamilyRoute && !req.auth?.user);

  if (needsSignIn) {
    const signInUrl = new URL("/login", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/family/:path*"],
};
