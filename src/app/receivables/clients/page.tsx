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
import { clientStatus } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getClients } from "@/lib/queries";
import { receivables } from "@/lib/routes";
import { canEditReceivables } from "@/lib/workspace-role";

const filters = [
  { value: "all", label: "All" },
  { value: "due", label: "Dues" },
  { value: "overdue", label: "Overdue" },
  { value: "settled", label: "Settled" },
];

const AVATAR = ["#0F766E", "#128C86", "#2563EB", "#7C3AED", "#B45309", "#BE123C"];

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
  const [clients, canEdit] = await Promise.all([getClients(), canEditReceivables()]);
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
    <div className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Accounts
          </p>
          <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Clients</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {clients.length} {clients.length === 1 ? "account" : "accounts"} on Cubity&apos;s book
          </p>
        </div>
      </div>

      <form className="grid gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search name, phone, site"
              className="h-14 rounded-2xl pl-11"
            />
          </div>
          <input type="hidden" name="filter" value={filter} />
          <Button type="submit" variant="outline" className="h-14 shrink-0 rounded-2xl px-5">
            Search
          </Button>
        </div>
        <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
          {filters.map((item) => (
            <Link
              key={item.value}
              href={receivables.clientsList(item.value, q)}
              className={
                filter === item.value
                  ? "inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                  : "inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-5 text-sm font-medium text-muted-foreground ring-1 ring-border"
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
                ? canEdit
                  ? "Add a real client, then log dues and partial payments."
                  : "No client accounts to view yet."
                : "Try another search or filter."}
            </EmptyDescription>
          </EmptyHeader>
          {clients.length === 0 && canEdit ? (
            <EmptyContent>
              <Button asChild>
                <Link href={receivables.clientsNew}>Add client</Link>
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ client, status }, index) => (
            <Link
              key={client.id}
              href={receivables.client(client.id)}
              className="flex items-start gap-4 rounded-[1.5rem] bg-white px-5 py-5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(15,40,40,0.04)]"
            >
              <span
                className="grid size-14 shrink-0 place-items-center rounded-full text-sm font-semibold tracking-wide text-white"
                style={{ backgroundColor: AVATAR[index % AVATAR.length] }}
              >
                {initials(client.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-[17px] font-semibold tracking-tight">{client.name}</p>
                  <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-[#0F766E]">
                    {formatMoney(status.outstanding)}
                  </p>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {client.phone}
                  {client.siteName ? ` · ${client.siteName}` : ""}
                </p>
                <div className="mt-2.5">
                  <DueStatusBadge status={status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
