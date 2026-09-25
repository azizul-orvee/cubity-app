import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";

/**
 * Cache tags for database reads. Every server action that writes a table
 * calls `updateTag` with the matching tag, so the next page load reads fresh
 * rows instead of stale ones.
 */
export const TAGS = {
  clients: "db:clients",
  invoices: "db:invoices",
  payment: "db:payment",
} as const;

/** Safety net for edits made outside the app (Prisma Studio, SQL console). */
const MAX_AGE_SECONDS = 300;

/** Every DateTime column name in the Prisma schema, read from the generated client. */
const DATE_FIELDS = new Set(
  Prisma.dmmf.datamodel.models.flatMap((model) =>
    model.fields.filter((field) => field.type === "DateTime").map((field) => field.name),
  ),
);

/**
 * The Next.js data cache stores results as JSON, which turns Date objects into
 * strings. Walk the cached value and turn DateTime columns back into Dates so
 * callers get exactly what Prisma returned.
 */
function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) reviveDates(item);
    return value;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const record = value as Record<string, unknown>;
    for (const [key, field] of Object.entries(record)) {
      if (typeof field === "string" && DATE_FIELDS.has(key)) {
        record[key] = new Date(field);
      } else if (field && typeof field === "object") {
        reviveDates(field);
      }
    }
  }
  return value;
}

/** Cache a Prisma read across requests, tagged so writes can expire it. */
export function cachedQuery<Args extends unknown[], Result>(
  key: string,
  tag: (typeof TAGS)[keyof typeof TAGS],
  query: (...args: Args) => Promise<Result>,
) {
  const cached = unstable_cache(query, [key], { tags: [tag], revalidate: MAX_AGE_SECONDS });
  return async (...args: Args): Promise<Result> => reviveDates(await cached(...args));
}
