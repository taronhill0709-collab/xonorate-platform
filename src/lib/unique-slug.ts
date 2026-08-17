import { slugify } from "@/lib/slug";

/**
 * Inserts a row with a slug derived from `slugSource`, retrying with a
 * numeric suffix on a unique-constraint collision (Postgres error 23505).
 */
export async function insertWithUniqueSlug<T>(
  slugSource: string,
  insert: (slug: string) => Promise<T[]>,
): Promise<T> {
  const base = slugify(slugSource);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      const [row] = await insert(candidate);
      if (row) return row;
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && "code" in err && (err as { code?: string }).code === "23505";
      if (!isUniqueViolation) throw err;
    }
  }
  throw new Error("Could not generate a unique slug");
}

/**
 * Updates a row's slug, retrying with a numeric suffix on a unique-constraint
 * collision. Returns the slug that was actually saved, so callers can record
 * the previous value for a redirect before it's lost.
 */
export async function updateWithUniqueSlug(
  slugSource: string,
  update: (slug: string) => Promise<unknown[]>,
): Promise<string> {
  const base = slugify(slugSource);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      await update(candidate);
      return candidate;
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && "code" in err && (err as { code?: string }).code === "23505";
      if (!isUniqueViolation) throw err;
    }
  }
  throw new Error("Could not generate a unique slug");
}
