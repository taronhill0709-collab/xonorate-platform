import { getStore } from "@netlify/blobs";
import type { CaseOverviewDraft } from "@/lib/case-overview-extraction";

const UPLOADS_STORE = "case-overview-uploads";
const JOBS_STORE = "case-overview-jobs";

export type CaseOverviewJobStatus =
  | { status: "pending" }
  | { status: "done"; data: CaseOverviewDraft }
  | { status: "failed"; error: string };

/** Stashes the uploaded PDF's bytes so the background function (which runs
 * as a separate request) can read them by job id. */
export async function storeCaseOverviewUpload(jobId: string, file: File): Promise<void> {
  const store = getStore(UPLOADS_STORE);
  await store.set(jobId, await file.arrayBuffer(), {
    metadata: { contentType: file.type },
  });
}

export async function readCaseOverviewUpload(jobId: string): Promise<File | null> {
  const store = getStore(UPLOADS_STORE);
  const entry = await store.getWithMetadata(jobId, { type: "arrayBuffer" });
  if (!entry) return null;
  const contentType =
    typeof entry.metadata?.contentType === "string" ? entry.metadata.contentType : "application/pdf";
  return new File([entry.data], "overview.pdf", { type: contentType });
}

export async function deleteCaseOverviewUpload(jobId: string): Promise<void> {
  const store = getStore(UPLOADS_STORE);
  await store.delete(jobId);
}

export async function setCaseOverviewJobStatus(
  jobId: string,
  status: CaseOverviewJobStatus,
): Promise<void> {
  const store = getStore(JOBS_STORE);
  await store.setJSON(jobId, status);
}

/** Returns "pending" for a job that hasn't reported in yet at all, since the
 * background function may not have started (or finished starting) by the
 * time the client's first poll lands. */
export async function getCaseOverviewJobStatus(jobId: string): Promise<CaseOverviewJobStatus> {
  const store = getStore(JOBS_STORE);
  const status = await store.get(jobId, { type: "json" });
  return status ?? { status: "pending" };
}

export async function deleteCaseOverviewJob(jobId: string): Promise<void> {
  const store = getStore(JOBS_STORE);
  await store.delete(jobId);
}
