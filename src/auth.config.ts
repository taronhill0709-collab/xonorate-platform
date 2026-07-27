import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config: no adapter, no Node-only providers
 * (Credentials touches bcrypt + the DB). Netlify still deploys proxy.ts as
 * an Edge Function, so proxy.ts must only ever import this file — pulling
 * in `@/auth` there drags `pg` into a runtime that can't load it.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role =
          (user as { role?: "supporter" | "admin" }).role ?? "supporter";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role =
          (token.role as "supporter" | "admin") ?? "supporter";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
