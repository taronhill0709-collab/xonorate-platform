import { desc } from "drizzle-orm";
import Image from "next/image";
import { Field, FileInput, SubmitButton, TextInput } from "@/app/admin/_components/field";
import { db } from "@/db";
import { libraryPhotos } from "@/db/schema";
import { addLibraryPhoto, deleteLibraryPhotoEntry } from "./actions";

export default async function AdminPhotoLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const photos = await db.select().from(libraryPhotos).orderBy(desc(libraryPhotos.createdAt));

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">Photo library</p>
      <h1 className="mt-1 font-serif text-2xl text-foreground">Shared stock photos</h1>
      <p className="mt-1 text-sm text-muted">
        Generic photos (a courthouse, a gavel, a protest crowd) any editor can attach to a post that has
        no photo of its own from a source article or an upload — see the photo field on{" "}
        <span className="font-medium text-foreground">New editorial content</span>.
      </p>

      {error && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <form action={addLibraryPhoto} className="mt-6 space-y-3 rounded-lg border border-border p-4">
        <p className="font-mono text-[11px] font-bold tracking-widest text-label uppercase">Add a photo</p>
        <Field label="Label (e.g. “Courthouse exterior”, “Gavel close-up”)" name="label">
          <TextInput id="label" name="label" required />
        </Field>
        <Field label="Photo" name="photo">
          <FileInput id="photo" name="photo" accept="image/jpeg,image/png,image/webp,image/avif" required />
        </Field>
        <SubmitButton>Add to library</SubmitButton>
      </form>

      {photos.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No library photos yet — add one above.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-lg border border-border">
              <div className="relative aspect-video w-full">
                <Image src={photo.url} alt={photo.label} fill className="object-cover" unoptimized />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-foreground" title={photo.label}>
                  {photo.label}
                </p>
                <form action={deleteLibraryPhotoEntry.bind(null, photo.id)}>
                  <button type="submit" className="shrink-0 text-xs text-red-400 underline">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
