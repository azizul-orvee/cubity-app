import { cache } from "react";
import { prisma } from "@/lib/db";
import { cachedQuery, TAGS } from "@/lib/data-cache";
import { DEFAULT_PAYMENT, type PaymentInstructions } from "@/lib/company";
import { clientStatus, companySnapshot, type ClientWithEntries } from "@/lib/ledger";

export const getClients = cache(
  cachedQuery("clients", TAGS.clients, async () => {
    return prisma.client.findMany({
      include: { entries: true },
      orderBy: { name: "asc" },
    });
  }),
);

/** Just enough to pick a client when linking an invoice to one. */
export const getClientOptions = cache(
  cachedQuery("client-options", TAGS.clients, async () => {
    return prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, siteName: true },
    });
  }),
);

export const getClientEvents = cache(
  cachedQuery("client-events", TAGS.clients, async (clientId: string) => {
    return prisma.clientEvent.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),
);

export const getClient = cache(
  cachedQuery("client", TAGS.clients, async (id: string) => {
    return prisma.client.findUnique({
      where: { id },
      include: { entries: true },
    });
  }),
);

export async function getDashboardData() {
  const clients = await getClients();
  return {
    clients,
    snapshot: companySnapshot(clients),
  };
}

export function withStatus(clients: ClientWithEntries[]) {
  return clients.map((client) => ({
    ...client,
    status: clientStatus(client),
  }));
}

export const getPaymentInstructions = cache(
  cachedQuery("payment-instructions", TAGS.payment, loadPaymentInstructions),
);

async function loadPaymentInstructions(): Promise<PaymentInstructions> {
  const existing = await prisma.companyPayment.findUnique({ where: { id: "default" } });
  if (existing) {
    return {
      bkashNumber: existing.bkashNumber,
      bankName: existing.bankName,
      bankBranch: existing.bankBranch,
      bankAccountName: existing.bankAccountName,
      bankAccountNumber: existing.bankAccountNumber,
      bankRoutingNumber: existing.bankRoutingNumber,
    };
  }

  const created = await prisma.companyPayment.create({
    data: { id: "default", ...DEFAULT_PAYMENT },
  });
  return {
    bkashNumber: created.bkashNumber,
    bankName: created.bankName,
    bankBranch: created.bankBranch,
    bankAccountName: created.bankAccountName,
    bankAccountNumber: created.bankAccountNumber,
    bankRoutingNumber: created.bankRoutingNumber,
  };
}
