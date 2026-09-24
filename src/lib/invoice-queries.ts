import { cache } from "react";
import { prisma } from "@/lib/db";

export const getInvoices = cache(async () => {
  return prisma.invoice.findMany({
    include: { lines: { orderBy: { sortOrder: "asc" } } },
    orderBy: { issueDate: "desc" },
  });
});

export const getInvoice = cache(async (id: string) => {
  return prisma.invoice.findUnique({
    where: { id },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });
});

export function invoiceTotal(lines: { amount: number }[]) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function invoiceDue(invoice: { paidAmount: number; lines: { amount: number }[] }) {
  return invoiceTotal(invoice.lines) - invoice.paidAmount;
}
