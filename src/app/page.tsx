import type { ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  FileDown,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AGING_LABELS, type AgingKey } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getDashboardData } from "@/lib/queries";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "danger" | "ok";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-2xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        <div
          className={
            tone === "danger"
              ? "rounded-lg bg-destructive/10 p-2 text-destructive"
              : tone === "ok"
                ? "rounded-lg bg-primary/10 p-2 text-primary"
                : "rounded-lg bg-muted p-2 text-muted-foreground"
          }
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default async function HomePage() {
  const { snapshot } = await getDashboardData();
  const agingTotal = Object.values(snapshot.aging).reduce((sum, value) => sum + value, 0);

  if (snapshot.clientCount === 0) {
    return (
      <Empty className="border bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Start tracking Cubity receivables</EmptyTitle>
          <EmptyDescription>
            Add a client, log what they were supposed to pay, how much they paid today, and the date they promised the rest.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="size-4" />
              Add first client
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Cubity Engineering & Construction</p>
          <h1 className="text-2xl font-semibold tracking-tight">Receivables overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The company currently has {formatMoney(snapshot.totalOutstanding)} to collect from{" "}
            {snapshot.clientsWithDues} {snapshot.clientsWithDues === 1 ? "client" : "clients"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="/reports/outstanding">
              <FileDown className="size-4" />
              Outstanding PDF
            </a>
          </Button>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="size-4" />
              New client
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total to collect"
          value={formatMoney(snapshot.totalOutstanding)}
          hint={`From ${snapshot.clientsWithDues} client${snapshot.clientsWithDues === 1 ? "" : "s"} with open dues`}
          icon={Wallet}
          tone="ok"
        />
        <StatCard
          label="Overdue"
          value={formatMoney(snapshot.overdueAmount)}
          hint={`${snapshot.overdueCount} promised date${snapshot.overdueCount === 1 ? "" : "s"} already passed`}
          icon={AlertTriangle}
          tone={snapshot.overdueCount ? "danger" : "default"}
        />
        <StatCard
          label="Promised soon"
          value={formatMoney(snapshot.upcomingAmount)}
          hint={`${snapshot.upcomingCount} client${snapshot.upcomingCount === 1 ? "" : "s"} promised to pay in the next 14 days`}
          icon={CalendarClock}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(snapshot.collectedThisMonth)}
          hint={`${formatMoney(snapshot.billedThisMonth)} billed this month`}
          icon={Users}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Aging of outstanding dues</CardTitle>
          <CardDescription>
            How long money has been waiting, from the original due date. Use this to chase the oldest balances first.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(Object.keys(AGING_LABELS) as AgingKey[]).map((key) => {
            const amount = snapshot.aging[key];
            const pct = agingTotal > 0 ? Math.round((amount / agingTotal) * 100) : 0;
            return (
              <div key={key} className="grid gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{AGING_LABELS[key]}</span>
                  <span className="font-medium">{formatMoney(amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overdue follow-ups</CardTitle>
            <CardDescription>Promised dates that have already passed.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.overdueClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue right now.</p>
            ) : (
              snapshot.overdueClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Promised {formatDate(client.status.promised)} · {client.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(client.status.outstanding)}</p>
                    <DueStatusBadge status={client.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
            <CardDescription>Clients who promised to pay in the next 14 days.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.upcomingClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No promised payments in the next 14 days.</p>
            ) : (
              snapshot.upcomingClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(client.status.promised)} · {client.phone}
                    </p>
                  </div>
                  <p className="font-medium">{formatMoney(client.status.outstanding)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Largest open balances</CardTitle>
            <CardDescription>Where the most money is sitting.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients?filter=due">
              All clients
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2">
          {snapshot.topOutstanding.length === 0 ? (
            <p className="text-sm text-muted-foreground">All clients are settled.</p>
          ) : (
            snapshot.topOutstanding.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.siteName || client.organization || client.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatMoney(client.status.outstanding)}</p>
                  <DueStatusBadge status={client.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
