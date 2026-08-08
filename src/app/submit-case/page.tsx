import { SiteHeader } from "@/components/site-header";
import { CaseSubmissionForm } from "./case-form";

export default function SubmitCasePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Submit a case</h1>
        <p className="mt-2 text-sm text-muted">
          If you believe a loved one was wrongfully convicted, tell us about their case. Our
          team reviews every submission privately — nothing here is published without your
          knowledge. Just have a quick question instead? Use{" "}
          <a href="/submit-inquiry" className="text-brand underline">
            submit an inquiry
          </a>{" "}
          instead.
        </p>
        <CaseSubmissionForm />
      </main>
    </>
  );
}
