"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { sumPayments } from "@/lib/invoice-queries";
import { totals } from "@/lib/ledger";
import { clampDiscount } from "@/lib/money";
import { revalidateClient, revalidateInvoices } from "@/lib/revalidate";
import { invoices } from "@/lib/routes";
import { requireAccountant } from "@/lib/workspace-role";

/**
 * The bridge between the two products. Issuing an invoice is what creates a
 * receivable, so instead of re-typing the bill into the client ledger by hand
 * (or forgetting to), the invoice is linked to a client and pushed across once.
 */

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function resolvePromisedAmount(formData: FormData, remaining: number) {
  if (remaining <= 0) return null;
  const raw = formString(formData, "promisedAmount").trim();
  if (!raw) return remaining;
  if (!/^\d+$/.test(raw)) return remaining;
  const taka = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(taka) || taka <= 0) return remaining;
  return Math.min(taka * 100, remaining);
}

/** Point this invoice at a receivables client, or clear the link. */
export async function setInvoiceClient(invoiceId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, ledgerEntries: { where: { voidedAt: null }, select: { id: true } } },
  });
  if (!invoice) return { error: "That invoice is no longer here." };

  const clientId = formString(formData, "clientId").trim();

  if (!clientId) {
    if (invoice.ledgerEntries.length > 0) {
      return { error: "This bill is already on that client's ledger. Void those entries first." };
    }
    await prisma.invoice.update({ where: { id: invoiceId }, data: { clientId: null } });
    revalidateInvoices(invoiceId);
    redirect(invoices.invoice(invoiceId));
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return { error: "Pick a client from the list." };
  if (invoice.ledgerEntries.length > 0) {
    return { error: "This bill is already on a client's ledger. Void those entries first." };
  }

  await prisma.invoice.update({ where: { id: invoiceId }, data: { clientId: client.id } });
  revalidateInvoices(invoiceId);
  revalidateClient(client.id);
  redirect(invoices.invoice(invoiceId));
}

/**
 * Copy the bill onto the client ledger: one due for the total after discount,
 * plus a payment for every receipt already on the invoice. Each entry keeps the
 * invoice number, so the due statement says which bill it came from.
 */
export async function addInvoiceToLedger(invoiceId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: { select: { amount: true } },
      payments: { select: { amount: true, date: true } },
      ledgerEntries: { where: { voidedAt: null }, select: { id: true } },
    },
  });
  if (!invoice) return { error: "That invoice is no longer here." };
  if (!invoice.clientId) return { error: "Link this invoice to a client first." };
  if (invoice.ledgerEntries.length > 0) {
    return { error: "This bill is already on the ledger." };
  }

  const billed = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const net = clampDiscount(billed, invoice.discountAmount).net;
  if (net <= 0) return { error: "This invoice has nothing left to bill." };

  const date = parseDateInput(formString(formData, "date")) ?? invoice.issueDate;
  const promisedDate = parseDateInput(formString(formData, "promisedDate"));

  const client = await prisma.client.findUnique({
    where: { id: invoice.clientId },
    include: { entries: true },
  });
  if (!client) return { error: "That client is no longer here." };

  const alreadyPaid = sumPayments(invoice.payments);
  const remainingAfter = totals(client.entries, client.discountAmount).outstanding + net - alreadyPaid;
  if (remainingAfter > 0 && !promisedDate) {
    return { error: "Set the date they promised to pay the remaining amount." };
  }
  const promisedAmount = remainingAfter > 0 ? resolvePromisedAmount(formData, remainingAfter) : null;
  const promise = remainingAfter > 0 ? promisedDate : null;
  const note = `Invoice ${invoice.number}`;

  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.create({
      data: {
        clientId: client.id,
        invoiceId: invoice.id,
        type: "DUE",
        amount: net,
        date,
        note,
        promisedDate: promise,
        promisedAmount,
      },
    });

    for (const payment of invoice.payments) {
      await tx.ledgerEntry.create({
        data: {
          clientId: client.id,
          invoiceId: invoice.id,
          type: "PAYMENT",
          amount: payment.amount,
          date: payment.date,
          note,
          promisedDate: promise,
          promisedAmount,
        },
      });
    }

    await tx.client.update({
      where: { id: client.id },
      data: { nextPromisedDate: promise, nextPromisedAmount: promisedAmount },
    });
  });

  revalidateClient(client.id);
  revalidateInvoices(invoiceId);
  redirect(invoices.invoice(invoiceId));
}
