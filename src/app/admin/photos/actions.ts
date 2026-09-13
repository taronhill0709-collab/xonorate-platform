"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { libraryPhotos } from "@/db/schema";
import { deleteLibraryPhotoBlob, InvalidLibraryPhotoError, uploadLibraryPhoto } from "@/lib/library-photo-storage";
import { requireAdmin } from "@/lib/require-admin";

const LIBRARY_PHOTO_PATH_RE = /^\/api\/library-photos\/(.+)$/;

export async function addLibraryPhoto(formData: FormData) {
  await requireAdmin();

  const label = String(formData.get("label") ?? "").trim();
  const photoFile = formData.get("photo");
  if (!label || !(photoFile instanceof File) || photoFile.size === 0) {
    redirect("/admin/photos?error=" + encodeURIComponent("A label and a photo are both required."));
  }

  let url: string;
  try {
    url = await uploadLibraryPhoto(photoFile);
  } catch (err) {
    if (err instanceof InvalidLibraryPhotoError) {
      redirect(`/admin/photos?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  await db.insert(libraryPhotos).values({ url, label });
  revalidatePath("/admin/photos");
  revalidatePath("/admin/posts/new");
}

export async function deleteLibraryPhotoEntry(photoId: string) {
  await requireAdmin();

  const [photo] = await db.select().from(libraryPhotos).where(eq(libraryPhotos.id, photoId)).limit(1);
  if (photo) {
    const match = photo.url.match(LIBRARY_PHOTO_PATH_RE);
    if (match) await deleteLibraryPhotoBlob(match[1]);
    await db.delete(libraryPhotos).where(eq(libraryPhotos.id, photoId));
  }

  revalidatePath("/admin/photos");
  revalidatePath("/admin/posts/new");
}
