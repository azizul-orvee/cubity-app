import { cache } from "react";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/data-cache";
import { clampDiscount } from "@/lib/money";

/**
 * The paid total is never stored. It is the sum of the receipts on the invoice,
 * derived here so the screen, the PDF, the file name, and the seal can never
 * disagree with the payment rows.
 */
export function sumPayments(payments: { amount: number }[]) {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export const getInvoices = cache(
  cachedQuery("invoices", TAGS.invoices, async () => {
    const rows = await prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      select: {
        id: true,
        number: true,
        clientName: true,
        clientId: true,
        issueDate: true,
        createdAt: true,
        discountAmount: true,
        lines: { select: { amount: true } },
        payments: { select: { amount: true } },
      },
    });
    return rows.map(({ payments, ...invoice }) => ({
      ...invoice,
      paidAmount: sumPayments(payments),
    }));
  }),
);

export const getInvoice = cache(
  cachedQuery("invoice", TAGS.invoices, async (id: string) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
        client: { select: { id: true, name: true } },
        ledgerEntries: {
          where: { voidedAt: null },
          select: { id: true, clientId: true, createdAt: true },
        },
      },
    });
    if (!invoice) return null;
    return { ...invoice, paidAmount: sumPayments(invoice.payments) };
  }),
);

export function invoiceTotal(lines: { amount: number }[]) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function invoiceBill(invoice: { discountAmount?: number | null; lines: { amount: number }[] }) {
  return clampDiscount(invoiceTotal(invoice.lines), invoice.discountAmount ?? 0);
}

export function invoiceDue(invoice: { paidAmount: number; discountAmount?: number | null; lines: { amount: number }[] }) {
  return invoiceBill(invoice).net - invoice.paidAmount;
}

export type InvoicePayStatus = "paid" | "unpaid" | "partial";

export function invoicePayStatus(paidAmount: number, total: number): InvoicePayStatus {
  if (total <= 0 || paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "partial";
}

export function invoicePayFileLabel(status: InvoicePayStatus) {
  if (status === "paid") return "Paid";
  if (status === "partial") return "PartialPaid";
  return "Unpaid";
}

export function invoicePdfFilename(number: string, paidAmount: number, total: number) {
  const label = invoicePayFileLabel(invoicePayStatus(paidAmount, total));
  return `Invoice-${number}-${label}.pdf`;
}
