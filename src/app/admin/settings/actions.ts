"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { InvalidCasePhotoError, uploadCasePhoto } from "@/lib/case-photo-storage";
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

  // A newly uploaded file replaces the photo; otherwise the hidden
  // `founderPhotoUrl` field carries forward whatever was already set.
  const photoFile = formData.get("founderPhoto");
  const founderPhotoUrl =
    photoFile instanceof File && photoFile.size > 0
      ? await uploadCasePhoto(photoFile).catch((err) => {
          if (err instanceof InvalidCasePhotoError) {
            redirect(`/admin/settings?photoError=${encodeURIComponent(err.message)}`);
          }
          throw err;
        })
      : normalizeText(formData.get("founderPhotoUrl"));

  const heroImageFile = formData.get("heroImage");
  const heroImageUrl =
    heroImageFile instanceof File && heroImageFile.size > 0
      ? await uploadCasePhoto(heroImageFile).catch((err) => {
          if (err instanceof InvalidCasePhotoError) {
            redirect(`/admin/settings?photoError=${encodeURIComponent(err.message)}`);
          }
          throw err;
        })
      : normalizeText(formData.get("heroImageUrl"));

  await db
    .insert(siteSettings)
    .values({
      id: "singleton",
      socialViewsLabel,
      facebookUrl,
      instagramUrl,
      founderPhotoUrl,
      heroImageUrl,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { socialViewsLabel, facebookUrl, instagramUrl, founderPhotoUrl, heroImageUrl },
    });

  revalidatePath("/", "layout");
  revalidatePath("/about");
  redirect("/admin/settings?saved=1");
}
