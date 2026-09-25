import { cache } from "react";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/data-cache";

export const getInvoices = cache(
  cachedQuery("invoices", TAGS.invoices, async () => {
    return prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      select: {
        id: true,
        number: true,
        clientName: true,
        issueDate: true,
        createdAt: true,
        paidAmount: true,
        lines: { select: { amount: true } },
      },
    });
  }),
);

export const getInvoice = cache(
  cachedQuery("invoice", TAGS.invoices, async (id: string) => {
    return prisma.invoice.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
  }),
);

export function invoiceTotal(lines: { amount: number }[]) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function invoiceDue(invoice: { paidAmount: number; lines: { amount: number }[] }) {
  return invoiceTotal(invoice.lines) - invoice.paidAmount;
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
