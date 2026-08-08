import { SiteHeader } from "@/components/site-header";
import { InquiryForm } from "./inquiry-form";

export default function SubmitInquiryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Submit an inquiry</h1>
        <p className="mt-2 text-sm text-muted">
          Have a general question, tip, or something else you&apos;d like to ask us? Send a
          quick message and our team will get back to you. If you&apos;re ready to formally
          submit a loved one&apos;s case for review, use{" "}
          <a href="/submit-case" className="text-brand underline">
            submit a case
          </a>{" "}
          instead.
        </p>
        <InquiryForm />
      </main>
    </>
  );
}
