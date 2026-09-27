"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidateServices } from "@/lib/revalidate";

type Result = { error?: string; ok?: boolean };

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) return { error: "Enter a service name." };
  if (name.length > 120) return { error: "That name is too long." };
  return { name };
}

/** A blank amount means "ask every time". */
function readDefaultAmount(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return { defaultAmount: null };
  if (!/^\d+$/.test(trimmed)) return { error: "The usual amount must be a whole number." };
  const taka = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(taka)) return { error: "Enter a valid amount." };
  return { defaultAmount: taka * 100 };
}

function duplicateName(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createService(formData: FormData): Promise<Result> {
  const parsed = readName(formString(formData, "name"));
  if ("error" in parsed) return parsed;
  const amount = readDefaultAmount(formString(formData, "defaultAmount"));
  if ("error" in amount) return amount;

  // A service removed earlier comes back rather than clashing with its own name.
  const archived = await prisma.service.findUnique({
    where: { name: parsed.name },
    select: { id: true, archivedAt: true },
  });
  if (archived?.archivedAt) {
    await prisma.service.update({
      where: { id: archived.id },
      data: { archivedAt: null, defaultAmount: amount.defaultAmount },
    });
    revalidateServices();
    return { ok: true };
  }
  if (archived) return { error: "That service is already on the list." };

  const last = await prisma.service.aggregate({ _max: { sortOrder: true } });
  try {
    await prisma.service.create({
      data: {
        name: parsed.name,
        defaultAmount: amount.defaultAmount,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
  } catch (error) {
    if (duplicateName(error)) return { error: "That service is already on the list." };
    throw error;
  }

  revalidateServices();
  return { ok: true };
}

export async function updateService(serviceId: string, formData: FormData): Promise<Result> {
  const parsed = readName(formString(formData, "name"));
  if ("error" in parsed) return parsed;
  const amount = readDefaultAmount(formString(formData, "defaultAmount"));
  if ("error" in amount) return amount;

  try {
    await prisma.service.update({
      where: { id: serviceId },
      data: { name: parsed.name, defaultAmount: amount.defaultAmount },
    });
  } catch (error) {
    if (duplicateName(error)) return { error: "Another service already uses that name." };
    throw error;
  }

  revalidateServices();
  return { ok: true };
}

/**
 * Removing a service archives it. Invoices keep their own copy of the name, so
 * an old bill is never rewritten, and Undo brings the service straight back.
 */
export async function archiveService(serviceId: string): Promise<Result> {
  await prisma.service.update({
    where: { id: serviceId },
    data: { archivedAt: new Date() },
  });
  revalidateServices();
  return { ok: true };
}

export async function restoreService(serviceId: string): Promise<Result> {
  await prisma.service.update({
    where: { id: serviceId },
    data: { archivedAt: null },
  });
  revalidateServices();
  return { ok: true };
}

/**
 * One-time move of a phone's old localStorage list into the shared catalog.
 * Names already in the catalog are skipped, so running it twice is harmless.
 */
export async function importPhoneServices(names: string[]): Promise<Result> {
  const cleaned = [...new Set(
    names
      .map((name) => name.trim().replace(/\s+/g, " "))
      .filter((name) => name.length >= 2 && name.length <= 120),
  )];
  if (cleaned.length === 0) return { error: "Nothing to add from this phone." };

  const existing = await prisma.service.findMany({
    where: { name: { in: cleaned } },
    select: { name: true },
  });
  const known = new Set(existing.map((service) => service.name));
  const fresh = cleaned.filter((name) => !known.has(name));
  if (fresh.length === 0) {
    revalidateServices();
    return { ok: true };
  }

  const last = await prisma.service.aggregate({ _max: { sortOrder: true } });
  const base = (last._max.sortOrder ?? 0) + 1;
  await prisma.service.createMany({
    data: fresh.map((name, index) => ({ name, sortOrder: base + index })),
    skipDuplicates: true,
  });

  revalidateServices();
  return { ok: true };
}
