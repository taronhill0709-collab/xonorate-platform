"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PasswordInput } from "@/components/password-input";

/** Only allow same-origin relative paths — callbackUrl is attacker-controlled query input, and it's used directly as a redirect target. */
function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  return raw;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" }
    | { kind: "error"; message: string }
    | { kind: "magic-link-sent" }
    | { kind: "loading" }
  >({ kind: "idle" });

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setStatus({ kind: "error", message: "Incorrect email or password." });
      return;
    }
    // Use the relative callbackUrl, not result.url: behind netlify dev's
    // proxy (:8888 -> internal Next server on :3000), the internal
    // server's own Host header can leak into result.url, redirecting to
    // the wrong origin and stranding the session cookie there.
    window.location.href = callbackUrl;
  }

  async function handleMagicLinkSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const result = await signIn("resend", {
      email,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setStatus({
        kind: "error",
        message: "Couldn't send a sign-in link. Please try again.",
      });
      return;
    }
    setStatus({ kind: "magic-link-sent" });
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Xonorate Media Platform staff and supporters.
      </p>

      {status.kind === "magic-link-sent" ? (
        <p className="mt-8 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
          Check {email} for a sign-in link.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            {status.kind === "error" && (
              <p className="text-sm text-red-600">{status.message}</p>
            )}
            <button
              type="submit"
              disabled={status.kind === "loading"}
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              Sign in
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleMagicLinkSignIn}>
            <button
              type="submit"
              disabled={status.kind === "loading" || !email}
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted-background disabled:opacity-60"
            >
              Email me a sign-in link
            </button>
          </form>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        New supporter?{" "}
        <Link href="/signup" className="text-brand underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
