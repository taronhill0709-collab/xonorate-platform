import { SiteHeader } from "@/components/site-header";
import { InquiryForm } from "./inquiry-form";

export default function SubmitInquiryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Submit an inquiry</h1>
        <p className="mt-2 text-sm text-muted">
          If you believe a loved one was wrongfully convicted, tell us about their case. Our
          team reviews every submission privately — nothing here is published without your
          knowledge.
        </p>
        <InquiryForm />
      </main>
    </>
  );
}
