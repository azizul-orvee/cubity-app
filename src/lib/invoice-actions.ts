"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
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

async function nextInvoiceNumber() {
  const latest = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" }, select: { number: true } });
  const current = Number.parseInt(latest?.number.replace(/\D/g, "") ?? "0", 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  return `INV-${String(next).padStart(4, "0")}`;
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

  if (invoiceId) {
    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (!existing) return { error: "That invoice is no longer here." };
    await prisma.$transaction([
      prisma.invoiceLine.deleteMany({ where: { invoiceId } }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { ...parsed.data, issueDate, paidAmount, lines: { create: lines } },
      }),
    ]);
    revalidateInvoices(invoiceId);
    redirect(invoices.invoice(invoiceId));
  }

  const created = await prisma.invoice.create({
    data: {
      number: await nextInvoiceNumber(),
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
