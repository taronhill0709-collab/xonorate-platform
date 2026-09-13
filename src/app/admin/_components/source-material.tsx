export type SourceMaterialItem = {
  id: string;
  headline: string;
  sourcePublication: string;
  sourceUrl: string;
  publishedAt: Date | null;
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function SourceRow({ item }: { item: SourceMaterialItem }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div>
        <span className="font-medium text-foreground">{item.sourcePublication}</span>
        <span className="text-muted"> — {item.headline}</span>
        {item.publishedAt && <span className="text-muted"> · {DATE_FORMAT.format(item.publishedAt)}</span>}
      </div>
      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-brand underline">
        Open source →
      </a>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

/** The "source-first" panel shown while creating/editing Xonorate content —
 * posts and investigations both use this (contentSources is polymorphic
 * across both). Shows what this piece is based on (spec: "Source
 * material"), lets an editor remove an already-attached source, attach
 * more from what Xonorate Intelligence already discovered, or add a source
 * of their own (an article Intelligence never found — see
 * createManualSourceIfProvided in content-sources.ts, which the same
 * create/update action calls). Never publishes anything itself; it only
 * records provenance. */
export function SourceMaterialSection({
  primaryReadOnly,
  removableSources,
  candidateSources,
  removeAction,
}: {
  /** The intelligence item this content was created from via "Create With
   * This" — always attached, shown read-only (its id travels as a hidden
   * `sourceIntelligenceItemId` field alongside this on the /new page). */
  primaryReadOnly?: SourceMaterialItem | null;
  /** Already-attached sources the editor can remove (edit page only). */
  removableSources: { contentSourceId: string; item: SourceMaterialItem }[];
  /** Other recent, unused intelligence items an editor can add. */
  candidateSources: SourceMaterialItem[];
  removeAction?: (contentSourceId: string) => Promise<void>;
}) {
  const hasAnySources = primaryReadOnly || removableSources.length > 0;

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="font-mono text-[11px] font-bold tracking-widest text-label uppercase">Source material</p>

      {!hasAnySources && <p className="mt-2 text-sm text-muted">No source attached — this is original content.</p>}

      {primaryReadOnly && (
        <div className="mt-2">
          <SourceRow item={primaryReadOnly} />
        </div>
      )}

      {removableSources.length > 0 && (
        <div className="mt-2 space-y-2">
          {removableSources.map(({ contentSourceId, item }) => (
            <div key={contentSourceId} className="flex items-center justify-between gap-3">
              <SourceRow item={item} />
              {removeAction && (
                // A plain button with its own formAction, not a nested <form>
                // — this whole section already lives inside the page's main
                // edit <form>, and HTML forms can't nest. formNoValidate
                // lets this submit even if some other field is blank.
                <button
                  type="submit"
                  formAction={removeAction.bind(null, contentSourceId)}
                  formNoValidate
                  className="shrink-0 text-xs text-red-400 underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {candidateSources.length > 0 && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-foreground">Add another source (optional)</label>
          <select
            name="additionalSourceIds"
            multiple
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            size={Math.min(6, Math.max(3, candidateSources.length))}
          >
            {candidateSources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sourcePublication} — {item.headline}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Cmd/Ctrl-click to select multiple, from recently discovered items.</p>
        </div>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-brand underline">
          Add a source of your own (one Xonorate Intelligence hasn&apos;t found)
        </summary>
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          <div>
            <label htmlFor="manualSourceUrl" className="block text-xs font-medium text-foreground">
              Source URL
            </label>
            <input id="manualSourceUrl" name="manualSourceUrl" type="url" placeholder="https://…" className={inputClass} />
          </div>
          <div>
            <label htmlFor="manualSourceHeadline" className="block text-xs font-medium text-foreground">
              Headline (optional)
            </label>
            <input id="manualSourceHeadline" name="manualSourceHeadline" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="manualSourcePublication" className="block text-xs font-medium text-foreground">
              Publication (optional)
            </label>
            <input id="manualSourcePublication" name="manualSourcePublication" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="manualSourceSummary" className="block text-xs font-medium text-foreground">
              What it reports (optional)
            </label>
            <textarea id="manualSourceSummary" name="manualSourceSummary" rows={2} className={inputClass} />
          </div>
          <p className="text-xs text-muted">Filling in the URL and saving attaches this as a source.</p>
        </div>
      </details>
    </div>
  );
}
