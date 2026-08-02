"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

/** Empty strings save as null so a blanked-out field actually clears it. */
function normalizeText(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();

  const socialViewsLabel = normalizeText(formData.get("socialViewsLabel"));
  const facebookUrl = normalizeText(formData.get("facebookUrl"));
  const instagramUrl = normalizeText(formData.get("instagramUrl"));

  await db
    .insert(siteSettings)
    .values({ id: "singleton", socialViewsLabel, facebookUrl, instagramUrl })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { socialViewsLabel, facebookUrl, instagramUrl },
    });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
