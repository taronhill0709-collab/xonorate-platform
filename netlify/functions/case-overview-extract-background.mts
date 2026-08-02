import { extractCaseOverview, InvalidCaseDocumentError } from "../../src/lib/case-overview-extraction";
import {
  deleteCaseOverviewUpload,
  readCaseOverviewUpload,
  setCaseOverviewJobStatus,
} from "../../src/lib/case-overview-jobs";

// Background function: 15-minute execution budget (vs 30s for regular
// functions). A full-document Claude extraction reliably takes 30-45+
// seconds, which blew past the regular function budget when this ran
// inline inside the New Case Server Action -- same class of problem
// daily-content-background already exists to solve, so this follows the
// same trigger/background split. Triggered by the startCaseOverviewExtraction
// Server Action (cases/actions.ts), not called directly by users.
async function handler(req: Request) {
  const secret = req.headers.get("x-internal-job-secret");
  // Reused from the daily-content pipeline's own secret -- this just proves
  // the request came from our own server, not the daily content feature
  // specifically.
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[case-overview-extract-background] rejected: missing or invalid secret");
    return;
  }

  const { jobId } = (await req.json()) as { jobId?: string };
  if (!jobId) {
    console.error("[case-overview-extract-background] missing jobId");
    return;
  }

  try {
    const file = await readCaseOverviewUpload(jobId);
    if (!file) throw new InvalidCaseDocumentError("Upload expired — try again.");

    const data = await extractCaseOverview(file);
    await setCaseOverviewJobStatus(jobId, { status: "done", data });
    console.log(`[case-overview-extract-background] extracted case for "${data.clientName}" (${jobId})`);
  } catch (err) {
    const message = err instanceof InvalidCaseDocumentError ? err.message : "Couldn't read that document. Try again.";
    if (!(err instanceof InvalidCaseDocumentError)) {
      console.error(`[case-overview-extract-background] extraction failed (${jobId})`, err);
    }
    await setCaseOverviewJobStatus(jobId, { status: "failed", error: message });
  } finally {
    await deleteCaseOverviewUpload(jobId);
  }
}

export default handler;
