import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Track the petitions you&apos;ve signed and the cases you&apos;re supporting.
        </p>
        <SignupForm />
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand underline">
            Sign in
          </Link>
        </p>
      </main>
    </>
  );
}
