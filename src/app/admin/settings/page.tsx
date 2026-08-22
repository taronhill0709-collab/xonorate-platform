import { eq } from "drizzle-orm";
import Image from "next/image";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { Field, FileInput, SubmitButton, TextInput } from "../_components/field";
import { saveSettings } from "./actions";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ photoError?: string }>;
}) {
  const { photoError } = await searchParams;
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">Settings</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Site-wide values that aren&apos;t tied to a single case, petition, or post.
      </p>

      {photoError && (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {photoError}
        </p>
      )}

      <form action={saveSettings} className="mt-6 space-y-4">
        <Field
          label="Homepage hero image — shown next to the headline on the homepage (leave blank to show the case-file placeholder graphic)"
          name="heroImage"
        >
          {settings?.heroImageUrl && (
            <Image
              src={settings.heroImageUrl}
              alt=""
              width={192}
              height={240}
              className="mb-2 h-40 w-32 border border-border object-cover"
              unoptimized
            />
          )}
          <FileInput
            id="heroImage"
            name="heroImage"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          <input type="hidden" name="heroImageUrl" value={settings?.heroImageUrl ?? ""} />
        </Field>

        <Field
          label="Founder photo — shown in the &quot;Our founder&quot; sections on the homepage and About page, separate from his case page photo"
          name="founderPhoto"
        >
          {settings?.founderPhotoUrl && (
            <Image
              src={settings.founderPhotoUrl}
              alt=""
              width={96}
              height={96}
              className="mb-2 h-24 w-24 rounded-full object-cover"
              unoptimized
            />
          )}
          <FileInput
            id="founderPhoto"
            name="founderPhoto"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          <input
            type="hidden"
            name="founderPhotoUrl"
            value={settings?.founderPhotoUrl ?? ""}
          />
        </Field>

        <Field
          label="Social media views/exposure — shown as-is in the homepage's &quot;Our impact so far&quot; section (leave blank to hide it)"
          name="socialViewsLabel"
        >
          <TextInput
            id="socialViewsLabel"
            name="socialViewsLabel"
            placeholder="6M+"
            defaultValue={settings?.socialViewsLabel ?? ""}
          />
        </Field>

        <Field
          label="Facebook URL — shown as a footer icon (leave blank to hide it)"
          name="facebookUrl"
        >
          <TextInput
            id="facebookUrl"
            name="facebookUrl"
            type="url"
            placeholder="https://facebook.com/xonorate"
            defaultValue={settings?.facebookUrl ?? ""}
          />
        </Field>

        <Field
          label="Instagram URL — shown as a footer icon (leave blank to hide it)"
          name="instagramUrl"
        >
          <TextInput
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            placeholder="https://instagram.com/xonorate"
            defaultValue={settings?.instagramUrl ?? ""}
          />
        </Field>

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
