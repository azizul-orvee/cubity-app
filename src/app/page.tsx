import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DueStatusBadge } from "@/components/due-status-badge";
import {
  AgingCapsule,
  ChartLegend,
  DonutChart,
  DualLineChart,
  HorizontalBars,
  RingMeter,
} from "@/components/charts";
import { CompanyStamp } from "@/components/company-stamp";
import { COMPANY } from "@/lib/company";
import { formatDate } from "@/lib/dates";
import { AGING_COLORS, AGING_LABELS, type AgingKey } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getDashboardData } from "@/lib/queries";

export default async function HomePage() {
  const { snapshot } = await getDashboardData();
  const collectionRate =
    snapshot.billedThisMonth > 0 ? snapshot.collectedThisMonth / snapshot.billedThisMonth : 0;
  const overdueShare =
    snapshot.totalOutstanding > 0 ? snapshot.overdueAmount / snapshot.totalOutstanding : 0;
  const upcomingShare =
    snapshot.totalOutstanding > 0 ? snapshot.upcomingAmount / snapshot.totalOutstanding : 0;
  const mixSlices = [
    { label: "Overdue", value: snapshot.mix.overdue, color: "#EF4444" },
    { label: "Promised soon", value: snapshot.mix.upcoming, color: "#F59E0B" },
    { label: "Later / unscheduled", value: snapshot.mix.later, color: "#2EC4B6" },
  ];
  const agingItems = (Object.keys(AGING_LABELS) as AgingKey[]).map((key) => ({
    key,
    label: AGING_LABELS[key],
    value: snapshot.aging[key],
    color: AGING_COLORS[key],
  }));

  return (
    <div className="grid gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            {COMPANY.city}
          </p>
          <h1 className="mt-1 text-[1.65rem] leading-tight font-semibold tracking-tight">
            Cash coming in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">What Cubity still has to collect.</p>
        </div>
        <Button className="hidden min-h-11 md:inline-flex" asChild>
          <Link href="/clients/new">
            <Plus className="size-4" />
            Client
          </Link>
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#128C86] via-[#2EC4B6] to-[#7DD3FC] p-5 text-white shadow-[0_18px_40px_rgba(18,140,134,0.28)]">
        <div className="absolute -top-10 -right-8 size-36 rounded-full bg-white/15" />
        <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-cyan-200/20" />
        <p className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase">
          Total to collect
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{formatMoney(snapshot.totalOutstanding)}</p>
        <p className="mt-2 text-sm text-white/85">
          {snapshot.clientsWithDues} {snapshot.clientsWithDues === 1 ? "client" : "clients"} with open dues
          {snapshot.clientCount ? ` · ${snapshot.clientCount} on the books` : ""}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            href="/clients?filter=overdue"
            className="rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm"
          >
            <p className="text-[11px] text-white/75">Overdue</p>
            <p className="text-lg font-semibold">{formatMoney(snapshot.overdueAmount)}</p>
          </Link>
          <Link href="/clients?filter=due" className="rounded-2xl bg-black/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/75">Collected this month</p>
            <p className="text-lg font-semibold">{formatMoney(snapshot.collectedThisMonth)}</p>
          </Link>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-3 gap-2">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-border">
          <RingMeter
            percent={overdueShare}
            color="#EF4444"
            track="#FDECEC"
            label="Overdue"
            value={formatMoney(snapshot.overdueAmount)}
            hint={`${snapshot.overdueCount} client${snapshot.overdueCount === 1 ? "" : "s"}`}
          />
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-border">
          <RingMeter
            percent={upcomingShare}
            color="#F59E0B"
            track="#FEF3C7"
            label="Soon"
            value={formatMoney(snapshot.upcomingAmount)}
            hint="Next 14 days"
          />
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-border">
          <RingMeter
            percent={collectionRate}
            color="#22C55E"
            track="#E8F8EE"
            label="Collected"
            value={formatMoney(snapshot.collectedThisMonth)}
            hint="vs billed"
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Where the money sits</h2>
          <p className="text-sm text-muted-foreground">Split of everything still outstanding.</p>
        </div>
        <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <DonutChart
            slices={mixSlices}
            centerLabel="Open"
            centerValue={formatMoney(snapshot.totalOutstanding)}
          />
          <ChartLegend slices={mixSlices} />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <div className="mb-1 flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Billed vs collected</h2>
            <p className="text-sm text-muted-foreground">Last 6 months of cash movement.</p>
          </div>
          <div className="flex gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-indigo-500">
              <span className="size-2 rounded-full bg-indigo-500" /> Billed
            </span>
            <span className="flex items-center gap-1 text-teal-600">
              <span className="size-2 rounded-full bg-teal-500" /> Collected
            </span>
          </div>
        </div>
        <DualLineChart points={snapshot.monthly} />
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <h2 className="text-base font-semibold">Aging</h2>
        <p className="mb-4 text-sm text-muted-foreground">How long dues have been waiting.</p>
        <AgingCapsule items={agingItems} />
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Largest balances</h2>
            <p className="text-sm text-muted-foreground">Chase the biggest numbers first.</p>
          </div>
          <Link href="/clients?filter=due" className="text-sm font-medium text-primary">
            All
          </Link>
        </div>
        <HorizontalBars
          rows={snapshot.topOutstanding.map((client, index) => ({
            id: client.id,
            name: client.name,
            value: client.status.outstanding,
            href: `/clients/${client.id}`,
            color: ["#2EC4B6", "#38BDF8", "#818CF8", "#F59E0B", "#F97316"][index % 5],
          }))}
        />
      </section>

      <section className="grid gap-4">
        <QueueCard
          title="Overdue"
          empty="Nothing overdue. Keep logging promised dates."
          icon={<AlertTriangle className="size-4" />}
          tone="danger"
          rows={snapshot.overdueClients.map((client) => ({
            id: client.id,
            title: client.name,
            meta: `Promised ${formatDate(client.status.promised)}`,
            amount: client.status.outstanding,
            href: `/clients/${client.id}`,
            status: client.status,
          }))}
        />
        <QueueCard
          title="Coming up"
          empty="No promised payments in the next 14 days."
          icon={<CalendarClock className="size-4" />}
          tone="warn"
          rows={snapshot.upcomingClients.map((client) => ({
            id: client.id,
            title: client.name,
            meta: formatDate(client.status.promised),
            amount: client.status.outstanding,
            href: `/clients/${client.id}`,
            status: client.status,
          }))}
        />
      </section>

      {snapshot.clientCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-primary/30 bg-white/70 p-6 text-center">
          <Wallet className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Add the first client</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log a site visit, what they paid, and the date they promised the rest. The rings fill as money moves.
          </p>
          <Button className="mt-4 min-h-11" asChild>
            <Link href="/clients/new">
              <Plus className="size-4" />
              New client
            </Link>
          </Button>
        </div>
      ) : null}

      <CompanyStamp />
    </div>
  );
}

function QueueCard({
  title,
  empty,
  icon,
  tone,
  rows,
}: {
  title: string;
  empty: string;
  icon: ReactNode;
  tone: "danger" | "warn";
  rows: {
    id: string;
    title: string;
    meta: string;
    amount: number;
    href: string;
    status: Parameters<typeof DueStatusBadge>[0]["status"];
  }[];
}) {
  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            tone === "danger"
              ? "grid size-8 place-items-center rounded-full bg-red-50 text-red-500"
              : "grid size-8 place-items-center rounded-full bg-amber-50 text-amber-600"
          }
        >
          {icon}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={row.href}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.meta}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatMoney(row.amount)}</p>
                <DueStatusBadge status={row.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
