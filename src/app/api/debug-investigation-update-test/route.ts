import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { investigations } from "@/db/schema";
import { InvalidCasePhotoError } from "@/lib/case-photo-storage";
import { resolvePhotoUpload } from "@/lib/resolve-photo-upload";

// THROWAWAY: reproduces updateInvestigation's real logic (minus the
// requireAdmin check, which would reject this unauthenticated test route
// before reaching the actual bug) against the investigation's *actual*
// current field values, changing only isFeatured — to find out why edits
// never seem to persist (its updatedAt hasn't moved since original
// publish). Delete after checking.
export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const investigationId = "5bea5cc2-9d84-403d-bdd7-fe0ef3daf60b";

  try {
    const [current] = await db.select().from(investigations).where(eq(investigations.id, investigationId)).limit(1);
    if (!current) return Response.json({ ok: false, error: "not found" }, { status: 404 });

    const formData = new FormData();
    formData.set("title", current.title);
    formData.set("subtitle", current.subtitle ?? "");
    formData.set("summary", current.summary);
    formData.set("thesis", current.thesis ?? "");
    formData.set("body", current.body ?? "");
    formData.set("status", current.status);
    formData.set("heroImageUrl", current.heroImageUrl ?? "");
    formData.set("isFeatured", "true");
    formData.set("editorialNotes", current.editorialNotes ?? "");

    // --- from here down mirrors updateInvestigation (actions.ts), minus requireAdmin/redirect ---
    const publishedAt = current.publishedAt ?? null;

    let heroImageUrl: string | null;
    try {
      heroImageUrl = await resolvePhotoUpload(formData, current.heroImageUrl ?? undefined);
    } catch (err) {
      if (err instanceof InvalidCasePhotoError) {
        return Response.json({ ok: false, step: "resolvePhotoUpload", error: err.message });
      }
      throw err;
    }

    await db
      .update(investigations)
      .set({
        title: current.title,
        subtitle: current.subtitle,
        summary: current.summary,
        thesis: current.thesis,
        body: current.body,
        status: current.status,
        heroImageUrl,
        editorialNotes: current.editorialNotes,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(investigations.id, investigationId));

    await db.update(investigations).set({ isFeatured: false }).where(ne(investigations.id, investigationId));
    await db.update(investigations).set({ isFeatured: true }).where(eq(investigations.id, investigationId));

    const [after] = await db.select().from(investigations).where(eq(investigations.id, investigationId)).limit(1);
    return Response.json({ ok: true, updatedAt: after?.updatedAt, isFeatured: after?.isFeatured });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
