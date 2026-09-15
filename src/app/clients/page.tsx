import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { value: "due", label: "Dues" },
  { value: "overdue", label: "Overdue" },
  { value: "settled", label: "Settled" },
];

const AVATAR = ["#2EC4B6", "#38BDF8", "#818CF8", "#F59E0B", "#FB7185", "#34D399"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

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
    <div className="grid gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground">
          {clients.length} on Cubity&apos;s book
        </p>
      </div>

      <form className="grid gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search name, phone, site" className="pl-10" />
          </div>
          <input type="hidden" name="filter" value={filter} />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((item) => (
            <Link
              key={item.value}
              href={`/clients?filter=${item.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={
                filter === item.value
                  ? "inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                  : "inline-flex min-h-10 shrink-0 items-center rounded-full bg-white px-4 text-sm font-medium text-muted-foreground ring-1 ring-border"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty className="border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>{clients.length === 0 ? "No clients yet" : "No matching clients"}</EmptyTitle>
            <EmptyDescription>
              {clients.length === 0
                ? "Add a real client, then log dues and partial payments."
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
        <div className="grid gap-2">
          {rows.map(({ client, status }, index) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-border"
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-semibold text-white"
                style={{ backgroundColor: AVATAR[index % AVATAR.length] }}
              >
                {initials(client.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{client.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {client.phone}
                  {client.siteName ? ` · ${client.siteName}` : ""}
                </p>
                {status.promised && status.outstanding > 0 ? (
                  <p className="text-[11px] text-muted-foreground">Promised {formatDate(status.promised)}</p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-[#128C86]">{formatMoney(status.outstanding)}</p>
                <DueStatusBadge status={status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
