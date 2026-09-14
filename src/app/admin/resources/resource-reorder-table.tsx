"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Badge } from "@/app/admin/_components/field";
import { POST_STATUS_LABEL } from "@/lib/post-type";
import { RESOURCE_CATEGORY_LABEL, RESOURCE_TYPE_LABEL } from "@/lib/resource-taxonomy";
import { moveResource, setResourceOrder } from "./actions";

export type ResourceReorderRow = {
  id: string;
  title: string;
  category: string;
  resourceType: string;
  status: string;
  featured: boolean;
};

/** The /admin/resources table — same drag/arrow reorder convention as
 * PostReorderTable (posts/post-reorder-table.tsx), driving the resource's
 * sortOrder on the public browse grid. */
export function ResourceReorderTable({ initialRows }: { initialRows: ResourceReorderRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function commitOrder(next: ResourceReorderRow[]) {
    setRows(next);
    startTransition(() => {
      setResourceOrder(next.map((r) => r.id));
    });
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;

    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    commitOrder(next);
  }

  function handleMove(resourceId: string, direction: "up" | "down") {
    const index = rows.findIndex((r) => r.id === resourceId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= rows.length) return;

    const next = [...rows];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setRows(next);
    startTransition(() => {
      moveResource(resourceId, direction);
    });
  }

  return (
    <table className="mt-6 w-full text-left text-sm">
      <thead className="text-muted">
        <tr className="border-b border-border">
          <th className="py-2 font-medium" />
          <th className="py-2 font-medium">Title</th>
          <th className="py-2 font-medium">Category</th>
          <th className="py-2 font-medium">Type</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium" />
        </tr>
      </thead>
      <tbody className={isPending ? "opacity-60 transition" : "transition"}>
        {rows.map((row, i) => (
          <tr
            key={row.id}
            draggable
            onDragStart={() => {
              dragIndexRef.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIndex(i);
            }}
            onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(i);
            }}
            onDragEnd={() => {
              dragIndexRef.current = null;
              setDragOverIndex(null);
            }}
            className={`border-b border-border ${dragOverIndex === i ? "bg-muted-background" : ""}`}
          >
            <td className="w-16 py-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="cursor-grab select-none text-base leading-none text-muted active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden
                >
                  ⠿
                </span>
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={isPending || i === 0}
                    onClick={() => handleMove(row.id, "up")}
                    className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={isPending || i === rows.length - 1}
                    onClick={() => handleMove(row.id, "down")}
                    className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </td>
            <td className="py-2 text-foreground">
              <Link href={`/admin/resources/${row.id}`} className="underline">
                {row.title}
              </Link>
              {row.featured && (
                <span className="ml-2">
                  <Badge tone="brand">Featured</Badge>
                </span>
              )}
            </td>
            <td className="py-2">{RESOURCE_CATEGORY_LABEL[row.category] ?? row.category}</td>
            <td className="py-2 text-muted">{RESOURCE_TYPE_LABEL[row.resourceType] ?? row.resourceType}</td>
            <td className="py-2">
              <Badge tone={row.status === "published" ? "brand" : "neutral"}>
                {POST_STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </td>
            <td className="py-2" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
