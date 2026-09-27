import { cache } from "react";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/data-cache";

export type CatalogService = {
  id: string;
  name: string;
  defaultAmount: number | null;
};

/** The office catalog, shared by every phone. Archived services stay out of it. */
export const getServices = cache(
  cachedQuery("services", TAGS.services, async (): Promise<CatalogService[]> => {
    return prisma.service.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, defaultAmount: true },
    });
  }),
);
