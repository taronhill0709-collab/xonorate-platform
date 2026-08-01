import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import {
  Field,
  SavedBanner,
  SubmitButton,
  TextInput,
} from "../_components/field";
import { saveSocialLinks } from "./actions";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">Settings</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Links to Xonorate&apos;s social profiles, shown in the site header.
      </p>

      {saved === "1" && <SavedBanner />}

      <form action={saveSocialLinks} className="mt-6 space-y-4">
        <Field label="Facebook page URL" name="facebookUrl">
          <TextInput
            id="facebookUrl"
            name="facebookUrl"
            type="url"
            placeholder="https://facebook.com/xonorate"
            defaultValue={settings?.facebookUrl ?? ""}
          />
        </Field>
        <Field label="Instagram profile URL" name="instagramUrl">
          <TextInput
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            placeholder="https://instagram.com/xonorate"
            defaultValue={settings?.instagramUrl ?? ""}
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

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
