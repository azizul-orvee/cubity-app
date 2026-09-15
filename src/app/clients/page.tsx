import Link from "next/link";
import { Phone, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DueStatusBadge } from "@/components/due-status-badge";
import { formatDate } from "@/lib/dates";
import { clientStatus } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getClients } from "@/lib/queries";

const filters = [
  { value: "all", label: "All" },
  { value: "due", label: "With dues" },
  { value: "overdue", label: "Overdue" },
  { value: "settled", label: "Settled" },
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter = "all" } = await searchParams;
  const clients = await getClients();
  const query = q.trim().toLowerCase();

  const rows = clients
    .map((client) => ({ client, status: clientStatus(client) }))
    .filter(({ client, status }) => {
      if (filter === "due" && status.outstanding <= 0) return false;
      if (filter === "overdue" && !status.overdue) return false;
      if (filter === "settled" && status.outstanding > 0) return false;
      if (!query) return true;
      const haystack = [client.name, client.phone, client.organization, client.siteName, client.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length === 1 ? "" : "s"} in Cubity&apos;s book.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="size-4" />
            New client
          </Link>
        </Button>
      </div>

      <form className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search name, phone, site..." className="pl-8" />
        </div>
        <input type="hidden" name="filter" value={filter} />
        <Button type="submit" variant="outline">
          Search
        </Button>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item.value} variant={filter === item.value ? "default" : "outline"} size="sm" asChild>
              <Link href={`/clients?filter=${item.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Phone />
            </EmptyMedia>
            <EmptyTitle>{clients.length === 0 ? "No clients yet" : "No matching clients"}</EmptyTitle>
            <EmptyDescription>
              {clients.length === 0
                ? "Add the first client, then log dues and partial payments against their profile."
                : "Try another search or filter."}
            </EmptyDescription>
          </EmptyHeader>
          {clients.length === 0 ? (
            <EmptyContent>
              <Button asChild>
                <Link href="/clients/new">Add client</Link>
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ client, status }) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.phone}
                      {client.siteName ? ` · ${client.siteName}` : ""}
                      {client.organization ? ` · ${client.organization}` : ""}
                    </p>
                    {status.promised && status.outstanding > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Promised {formatDate(status.promised)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-lg font-semibold">{formatMoney(status.outstanding)}</p>
                    <DueStatusBadge status={status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
