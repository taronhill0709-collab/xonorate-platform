import { getCasePhoto } from "@/lib/case-photo-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const photo = await getCasePhoto(key);
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(photo.data, {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
