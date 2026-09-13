"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FileInput } from "@/app/admin/_components/field";

export type LibraryPhotoOption = { id: string; url: string; label: string };

/** The post photo field: an upload (wins if a new file is chosen — see
 * resolvePostImageUrl in actions.ts), or a pick from the shared photo
 * library (admin/photos) written into the same hidden `imageUrl` field a
 * plain upload would use. A client component because picking a library
 * photo has to update the preview and the hidden field without a page
 * round-trip. */
export function PostPhotoField({
  defaultImageUrl,
  libraryPhotos,
}: {
  defaultImageUrl: string;
  libraryPhotos: LibraryPhotoOption[];
}) {
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function chooseLibraryPhoto(url: string) {
    // A library pick should win over whatever file was staged in the file
    // input — clear it so resolvePostImageUrl (actions.ts) doesn't ignore
    // this pick in favor of a leftover selected file.
    if (fileInputRef.current) fileInputRef.current.value = "";
    setImageUrl(url);
    setPickerOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  }

  return (
    <div>
      {imageUrl && (
        <div className="relative mb-2 h-[90px] w-40 overflow-hidden rounded-md">
          <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <FileInput
        id="photo"
        name="photo"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
      />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {libraryPhotos.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setPickerOpen((o) => !o)} className="text-sm text-brand underline">
            {pickerOpen ? "Hide photo library" : "Or choose from photo library →"}
          </button>
          {pickerOpen && (
            <div className="mt-2 grid grid-cols-4 gap-2 rounded-md border border-border p-2 sm:grid-cols-6">
              {libraryPhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => chooseLibraryPhoto(photo.url)}
                  title={photo.label}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border"
                >
                  <Image
                    src={photo.url}
                    alt={photo.label}
                    fill
                    className="object-cover transition group-hover:opacity-75"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
