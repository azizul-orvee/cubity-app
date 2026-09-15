import { prisma } from "@/lib/db";
import { clientStatus, companySnapshot, type ClientWithEntries } from "@/lib/ledger";

export async function getClients() {
  return prisma.client.findMany({
    include: { entries: true },
    orderBy: { name: "asc" },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: { entries: true },
  });
}

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
