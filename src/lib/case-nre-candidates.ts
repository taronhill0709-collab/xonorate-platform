import { getStore } from "@netlify/blobs";
import type { CaseCandidateDraft } from "@/lib/nre-case-research";

const CANDIDATES_STORE = "case-nre-candidates";
const INDEX_KEY = "_index";

export type CandidateIndexEntry = {
  id: string;
  clientName: string;
  state: string;
  createdAt: string;
};

async function getCandidateIndex(): Promise<CandidateIndexEntry[]> {
  const store = getStore(CANDIDATES_STORE);
  return (await store.get(INDEX_KEY, { type: "json" })) ?? [];
}

/** Stages a researched candidate for admin review — nothing is written to
 * the `cases` table until the admin explicitly saves it via the New Case
 * form (cases unlike posts have no draft/publish gate, so a daily research
 * job must never write there directly). These entries can sit for days
 * until reviewed, unlike the short-lived PDF-upload jobs in
 * case-overview-jobs.ts, which is why this is a separate store. */
export async function saveCaseNreCandidate(id: string, data: CaseCandidateDraft): Promise<void> {
  const store = getStore(CANDIDATES_STORE);
  await store.setJSON(id, data);
  const index = await getCandidateIndex();
  await store.setJSON(INDEX_KEY, [
    ...index,
    { id, clientName: data.clientName, state: data.state, createdAt: new Date().toISOString() },
  ]);
}

export async function getCaseNreCandidate(id: string): Promise<CaseCandidateDraft | null> {
  const store = getStore(CANDIDATES_STORE);
  return (await store.get(id, { type: "json" })) ?? null;
}

export async function deleteCaseNreCandidate(id: string): Promise<void> {
  const store = getStore(CANDIDATES_STORE);
  await store.delete(id);
  const index = await getCandidateIndex();
  await store.setJSON(
    INDEX_KEY,
    index.filter((entry) => entry.id !== id),
  );
}

export async function listCaseNreCandidates(): Promise<CandidateIndexEntry[]> {
  return getCandidateIndex();
}
