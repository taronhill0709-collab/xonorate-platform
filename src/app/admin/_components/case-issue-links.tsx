import { ISSUES } from "@/lib/issues";

/** Related-case / related-issue multi-select fields shared by the post
 * editor and the Investigation Builder — the "knowledge graph" connections
 * every Xonorate Intelligence-driven content type carries (spec §17-18). */
export function CaseAndIssueFields({
  caseRows,
  selectedCaseIds,
  selectedIssueTags,
}: {
  caseRows: { id: string; clientName: string }[];
  selectedCaseIds: string[];
  selectedIssueTags: string[];
}) {
  return (
    <>
      {caseRows.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground">Related cases (optional)</label>
          <select
            name="caseIds"
            multiple
            defaultValue={selectedCaseIds}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            size={Math.min(6, Math.max(3, caseRows.length))}
          >
            {caseRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Cmd/Ctrl-click to select multiple.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground">Related issues (optional)</label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ISSUES.map((issue) => (
            <label key={issue.tag} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="issueTags"
                value={issue.tag}
                defaultChecked={selectedIssueTags.includes(issue.tag)}
                className="h-4 w-4 rounded border-border"
              />
              {issue.title}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
