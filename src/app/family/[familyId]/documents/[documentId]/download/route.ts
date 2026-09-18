import { ForbiddenError, requireFamilyMember } from "@/family/authz";
import { downloadFamilyDocument } from "@/family/documents";

// Every download re-checks family membership on every request — this is
// the one place a family document is ever served from, and it is never a
// public route (unlike /api/case-photos/[key], which is deliberately
// public). No signed URLs, no caching that could outlive authorization —
// see storage-service.ts's header comment for why.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ familyId: string; documentId: string }> },
) {
  const { familyId, documentId } = await params;

  try {
    await requireFamilyMember(familyId);
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("Not found", { status: 404 });
    throw err;
  }

  const file = await downloadFamilyDocument(familyId, documentId);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.data, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
