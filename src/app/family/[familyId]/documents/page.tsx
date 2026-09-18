import Link from "next/link";
import { listFamilyDocuments } from "@/family/documents";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/family/documents-types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const documents = await listFamilyDocuments(familyId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Documents</h1>
          <p className="mt-1 text-sm text-muted">
            Private to your family. Only people you invite can access these
            documents.
          </p>
        </div>
        <Link
          href={`/family/${familyId}/documents/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No documents yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Keep important records organized in one private place.
          </p>
          <Link
            href={`/family/${familyId}/documents/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Upload Document
          </Link>
        </section>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-border bg-muted-background px-4 py-3"
            >
              <div>
                <Link
                  href={`/family/${familyId}/documents/${doc.id}/edit`}
                  className="font-medium transition hover:text-brand"
                >
                  {doc.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="rounded-full bg-brand-light px-2 py-0.5 font-semibold text-brand">
                    {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]}
                  </span>
                  {doc.lovedOneName && <span>{doc.lovedOneName}</span>}
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>
                    {doc.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <a
                href={`/family/${familyId}/documents/${doc.id}/download`}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
