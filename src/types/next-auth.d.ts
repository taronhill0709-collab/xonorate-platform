import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "supporter" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "supporter" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "supporter" | "admin";
  }
}
