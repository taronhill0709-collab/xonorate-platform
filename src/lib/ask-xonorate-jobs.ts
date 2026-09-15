import { getStore } from "@netlify/blobs";
import type { AskAnswerResolved } from "@/lib/ask-xonorate";

const JOBS_STORE = "ask-xonorate-jobs";

export type AskXonorateJobStatus =
  | { status: "pending" }
  | { status: "done"; questionId: string; answer: AskAnswerResolved }
  | { status: "failed"; error: string };

export async function setAskXonorateJobStatus(jobId: string, status: AskXonorateJobStatus): Promise<void> {
  const store = getStore(JOBS_STORE);
  await store.setJSON(jobId, status);
}

/** Returns "pending" for a job that hasn't reported in yet at all, since the
 * background function may not have started (or finished starting) by the
 * time the client's first poll lands — same convention as
 * content-draft-jobs.ts/case-overview-jobs.ts. */
export async function getAskXonorateJobStatus(jobId: string): Promise<AskXonorateJobStatus> {
  const store = getStore(JOBS_STORE);
  const status = await store.get(jobId, { type: "json" });
  return status ?? { status: "pending" };
}
