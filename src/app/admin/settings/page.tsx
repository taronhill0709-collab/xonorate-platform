import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { Field, SubmitButton, TextInput } from "../_components/field";
import { saveSettings } from "./actions";

export default async function AdminSettingsPage() {
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

      <form action={saveSettings} className="mt-6 space-y-4">
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
