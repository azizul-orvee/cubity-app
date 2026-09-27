"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { sumPayments } from "@/lib/invoice-queries";
import { clampDiscount } from "@/lib/money";
import { revalidateClient, revalidateInvoices } from "@/lib/revalidate";
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

/** Invoice ID: capital letters and numbers, optionally joined by single hyphens, e.g. CC420-2609-C01. */
const INVOICE_ID = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

function readDiscount(raw: string, gross: number) {
  const trimmed = raw.trim();
  if (!trimmed) return { discountAmount: 0 };
  if (!/^\d+$/.test(trimmed)) return { error: "Discount must be a whole number. No letters or fractions." };
  const amount = wholeTakaToPoisha(trimmed);
  if (amount == null) return { error: "Enter a valid discount." };
  if (amount > gross) return { error: "Discount cannot be more than the invoice total." };
  return { discountAmount: amount };
}

function readInvoiceId(formData: FormData) {
  const number = formString(formData, "number").trim().toUpperCase();
  if (!number) return { error: "Enter an invoice ID." };
  if (number.length > 40) return { error: "Invoice ID is too long. Keep it under 40 characters." };
  if (!INVOICE_ID.test(number)) {
    return { error: "Invoice ID can only use capital letters, numbers, and hyphens, like CC420-2609-C01." };
  }
  return { number };
}

/** The hidden client link the form carries, so editing a bill never drops it. */
async function readClientLink(formData: FormData) {
  const clientId = formString(formData, "clientId").trim();
  if (!clientId) return { clientId: null };
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return { clientId: null };
  return { clientId: client.id };
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
  const discount = readDiscount(formString(formData, "discount"), billed);
  if ("error" in discount) return discount;
  const net = clampDiscount(billed, discount.discountAmount).net;
  const { clientId } = await readClientLink(formData);

  const [taken, existing] = await Promise.all([
    prisma.invoice.findUnique({ where: { number }, select: { id: true } }),
    invoiceId
      ? prisma.invoice.findUnique({
          where: { id: invoiceId },
          select: {
            id: true,
            discountAmount: true,
            payments: { select: { amount: true } },
            lines: { select: { amount: true } },
            ledgerEntries: { where: { voidedAt: null }, select: { id: true } },
          },
        })
      : null,
  ]);
  if (taken && taken.id !== invoiceId) return { error: `Invoice ID ${number} is already used by another invoice.` };

  if (invoiceId) {
    if (!existing) return { error: "That invoice is no longer here." };
    const alreadyPaid = sumPayments(existing.payments);
    if (net < alreadyPaid) {
      return { error: "This total after discount is lower than the payments already recorded. Remove a payment on the invoice first." };
    }
    // Once the bill is a due on someone's ledger, changing what it adds up to
    // would leave the ledger saying one thing and the invoice another.
    const wasNet = clampDiscount(
      existing.lines.reduce((sum, line) => sum + line.amount, 0),
      existing.discountAmount,
    ).net;
    if (existing.ledgerEntries.length > 0 && net !== wasNet) {
      return {
        error: "This bill is already on the client ledger, so its total cannot change. Void those ledger entries first, then edit it.",
      };
    }
    await prisma.$transaction([
      prisma.invoiceLine.deleteMany({ where: { invoiceId } }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ...parsed.data,
          number,
          issueDate,
          discountAmount: discount.discountAmount,
          clientId,
          lines: { create: lines },
        },
      }),
    ]);
    revalidateInvoices(invoiceId);
    redirect(invoices.invoice(invoiceId));
  }

  let firstPayment = 0;
  let paidDate: Date | null = null;
  const paidRaw = formString(formData, "paid").trim();
  if (paidRaw && !/^\d+$/.test(paidRaw)) return { error: "Paid amount must be a whole number. No letters or fractions." };
  if (paidRaw) {
    const parsedPaid = wholeTakaToPoisha(paidRaw);
    if (parsedPaid == null) return { error: "Enter a valid paid amount." };
    firstPayment = parsedPaid;
  }
  if (firstPayment > net) return { error: "Paid amount is higher than the total after discount." };
  if (firstPayment > 0) {
    paidDate = parseDateInput(formString(formData, "paidDate"));
    if (!paidDate) return { error: "Choose the date of this payment." };
  }

  const created = await prisma.invoice.create({
    data: {
      number,
      ...parsed.data,
      issueDate,
      discountAmount: discount.discountAmount,
      clientId,
      lines: { create: lines },
      payments: paidDate ? { create: { amount: firstPayment, date: paidDate } } : undefined,
    },
  });
  revalidateInvoices(created.id);
  redirect(invoices.invoice(created.id));
}

export async function setInvoiceDiscount(invoiceId: string, formData: FormData) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      discountAmount: true,
      lines: { select: { amount: true } },
      payments: { select: { amount: true } },
      ledgerEntries: { where: { voidedAt: null }, select: { id: true } },
    },
  });
  if (!invoice) return { error: "That invoice is no longer here." };

  const billed = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const discount =
    formString(formData, "remove") === "1"
      ? { discountAmount: 0 }
      : readDiscount(formString(formData, "discount"), billed);
  if ("error" in discount) return discount;
  const net = clampDiscount(billed, discount.discountAmount).net;
  if (net < sumPayments(invoice.payments)) {
    return { error: "This discount would put the total below what has already been paid. Remove a payment first." };
  }
  if (invoice.ledgerEntries.length > 0 && discount.discountAmount !== invoice.discountAmount) {
    return {
      error: "This bill is already on the client ledger, so its total cannot change. Void those ledger entries first, then set the discount.",
    };
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { discountAmount: discount.discountAmount },
  });
  revalidateInvoices(invoiceId);
  redirect(invoices.invoice(invoiceId));
}

export async function recordInvoicePayment(invoiceId: string, formData: FormData) {
  const amountRaw = formString(formData, "amount").trim();
  if (!amountRaw) return { error: "Enter the amount received." };
  if (!/^\d+$/.test(amountRaw)) return { error: "Amount must be a whole number. No letters or fractions." };
  const amount = wholeTakaToPoisha(amountRaw);
  if (amount == null || amount <= 0) return { error: "Enter the amount received." };

  const date = parseDateInput(formString(formData, "date"));
  if (!date) return { error: "Choose a payment date." };

  const noteRaw = formString(formData, "note").trim();
  const note = noteRaw || null;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      discountAmount: true,
      lines: { select: { amount: true } },
      payments: { select: { amount: true } },
    },
  });
  if (!invoice) return { error: "That invoice is no longer here." };

  const billed = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const net = clampDiscount(billed, invoice.discountAmount).net;
  if (sumPayments(invoice.payments) + amount > net) {
    return { error: "That payment is higher than what is still due." };
  }

  await prisma.invoicePayment.create({ data: { invoiceId, amount, date, note } });
  revalidateInvoices(invoiceId);
  redirect(invoices.invoice(invoiceId));
}

export async function deleteInvoicePayment(invoiceId: string, paymentId: string, _formData?: FormData) {
  const payment = await prisma.invoicePayment.findFirst({
    where: { id: paymentId, invoiceId },
    select: { id: true },
  });
  if (!payment) redirect(invoices.invoice(invoiceId));

  await prisma.invoicePayment.delete({ where: { id: paymentId } });
  revalidateInvoices(invoiceId);
  redirect(invoices.invoice(invoiceId));
}

export async function deleteInvoice(invoiceId: string, _formData?: FormData) {
  // Deleting the bill leaves the client's ledger entries in place with their
  // invoice link cleared, so their cached rows have to be refreshed as well.
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { clientId: true },
  });
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidateInvoices(invoiceId);
  if (invoice?.clientId) revalidateClient(invoice.clientId);
  redirect(invoices.root);
}
