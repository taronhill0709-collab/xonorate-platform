import { getCaseVideoThumbnail } from "@/lib/case-video-thumbnail-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const thumbnail = await getCaseVideoThumbnail(key);
  if (!thumbnail) return new Response("Not found", { status: 404 });

  return new Response(thumbnail.data, {
    headers: {
      "Content-Type": thumbnail.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
