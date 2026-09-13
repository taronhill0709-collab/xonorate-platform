import { uploadCasePhoto } from "@/lib/case-photo-storage";

/** A newly uploaded file (form field "photo") replaces the photo;
 * otherwise the hidden fallback value (a library pick, a carried-over
 * source image, or whatever the row already had) carries forward. Shared
 * by posts and investigations — both attach a photo the same way. */
export async function resolvePhotoUpload(formData: FormData, fallbackImageUrl: string | undefined): Promise<string | null> {
  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    return uploadCasePhoto(photoFile);
  }
  return fallbackImageUrl?.trim() || null;
}
