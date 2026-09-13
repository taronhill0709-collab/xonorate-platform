import { getStore } from "@netlify/blobs";
import type { SourceClassification } from "@/lib/source-classify";

const JOBS_STORE = "content-draft-jobs";

export type ContentDraftJobStatus =
  | { status: "pending" }
  | { status: "done"; body: string; classification?: SourceClassification }
  | { status: "failed"; error: string };

export async function setContentDraftJobStatus(jobId: string, status: ContentDraftJobStatus): Promise<void> {
  const store = getStore(JOBS_STORE);
  await store.setJSON(jobId, status);
}

/** Returns "pending" for a job that hasn't reported in yet at all, since the
 * background function may not have started (or finished starting) by the
 * time the client's first poll lands. */
export async function getContentDraftJobStatus(jobId: string): Promise<ContentDraftJobStatus> {
  const store = getStore(JOBS_STORE);
  const status = await store.get(jobId, { type: "json" });
  return status ?? { status: "pending" };
}
