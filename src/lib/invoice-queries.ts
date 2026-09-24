import { cache } from "react";
import { prisma } from "@/lib/db";

export const getInvoices = cache(async () => {
  return prisma.invoice.findMany({
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      number: true,
      clientName: true,
      issueDate: true,
      paidAmount: true,
      lines: { select: { amount: true } },
    },
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
