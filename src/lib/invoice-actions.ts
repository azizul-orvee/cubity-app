"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/data-cache";
import { parseDateInput } from "@/lib/dates";
import { invoices } from "@/lib/routes";

function wholeTakaToPoisha(raw: string) {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const taka = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(taka)) return null;
  return taka * 100;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidateInvoices(id?: string) {
  updateTag(TAGS.invoices);
  revalidatePath(invoices.root);
  revalidatePath(invoices.services);
  revalidatePath(invoices.new);
  if (id) {
    revalidatePath(invoices.invoice(id));
    revalidatePath(invoices.edit(id));
  }
}

const invoiceSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  clientPhone: z.string().trim().optional().transform((value) => value || null),
  clientAddress: z.string().trim().optional().transform((value) => value || null),
  projectName: z.string().trim().optional().transform((value) => value || null),
  notes: z.string().trim().optional().transform((value) => value || null),
});

function readLines(formData: FormData) {
  const names = formData.getAll("serviceName").map((value) => (typeof value === "string" ? value.trim() : ""));
  const amounts = formData.getAll("amount").map((value) => (typeof value === "string" ? value : ""));
  const lines: { serviceName: string; amount: number; sortOrder: number }[] = [];

  for (const [index, serviceName] of names.entries()) {
    if (!serviceName) continue;
    const raw = (amounts[index] ?? "").trim();
    if (!raw) return { error: "Enter an amount for each selected service." };
    if (!/^\d+$/.test(raw)) return { error: "Amounts must be whole numbers. No letters or fractions." };
    const amount = wholeTakaToPoisha(raw);
    if (amount == null || amount <= 0) return { error: "Enter an amount for each selected service." };
    lines.push({ serviceName, amount, sortOrder: lines.length });
  }

  return { lines };
}

/** Invoice ID: capital letters and numbers, optionally joined by single hyphens, e.g. CC420-2509-C01. */
const INVOICE_ID = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

function readInvoiceId(formData: FormData) {
  const number = formString(formData, "number").trim().toUpperCase();
  if (!number) return { error: "Enter an invoice ID." };
  if (number.length > 40) return { error: "Invoice ID is too long. Keep it under 40 characters." };
  if (!INVOICE_ID.test(number)) {
    return { error: "Invoice ID can only use capital letters, numbers, and hyphens, like CC420-2509-C01." };
  }
  return { number };
}

export async function saveInvoice(invoiceId: string | null, formData: FormData) {
  const parsed = invoiceSchema.safeParse({
    clientName: formString(formData, "clientName"),
    clientPhone: formString(formData, "clientPhone"),
    clientAddress: formString(formData, "clientAddress"),
    projectName: formString(formData, "projectName"),
    notes: formString(formData, "notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the invoice." };
  }

  const id = readInvoiceId(formData);
  if ("error" in id) return id;
  const { number } = id;

  const issueDate = parseDateInput(formString(formData, "issueDate"));
  if (!issueDate) return { error: "Choose an issue date." };

  const read = readLines(formData);
  if ("error" in read) return read;
  const lines = read.lines;
  if (lines.length === 0) return { error: "Select at least one service and enter its amount." };

  const billed = lines.reduce((sum, line) => sum + line.amount, 0);
  const paidRaw = formString(formData, "paid").trim();
  if (paidRaw && !/^\d+$/.test(paidRaw)) return { error: "Paid amount must be a whole number. No letters or fractions." };
  const paidAmount = paidRaw ? wholeTakaToPoisha(paidRaw) : 0;
  if (paidAmount == null) return { error: "Enter a valid paid amount." };
  if (paidAmount > billed) return { error: "Paid amount is higher than the invoice total." };

  const [taken, existing] = await Promise.all([
    prisma.invoice.findUnique({ where: { number }, select: { id: true } }),
    invoiceId ? prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } }) : null,
  ]);
  if (taken && taken.id !== invoiceId) return { error: `Invoice ID ${number} is already used by another invoice.` };

  if (invoiceId) {
    if (!existing) return { error: "That invoice is no longer here." };
    await prisma.$transaction([
      prisma.invoiceLine.deleteMany({ where: { invoiceId } }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { ...parsed.data, number, issueDate, paidAmount, lines: { create: lines } },
      }),
    ]);
    revalidateInvoices(invoiceId);
    redirect(invoices.invoice(invoiceId));
  }

  const created = await prisma.invoice.create({
    data: {
      number,
      ...parsed.data,
      issueDate,
      paidAmount,
      lines: { create: lines },
    },
  });
  revalidateInvoices(created.id);
  redirect(invoices.invoice(created.id));
}

export async function deleteInvoice(invoiceId: string, _formData?: FormData) {
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidateInvoices(invoiceId);
  redirect(invoices.root);
}
