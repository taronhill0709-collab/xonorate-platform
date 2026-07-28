"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

/** Empty strings save as null so a blanked-out field actually clears the link. */
function normalizeUrl(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveSocialLinks(formData: FormData) {
  await requireAdmin();

  const facebookUrl = normalizeUrl(formData.get("facebookUrl"));
  const instagramUrl = normalizeUrl(formData.get("instagramUrl"));

  await db
    .insert(siteSettings)
    .values({ id: "singleton", facebookUrl, instagramUrl })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { facebookUrl, instagramUrl },
    });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
