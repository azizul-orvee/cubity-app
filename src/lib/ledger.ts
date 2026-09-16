import type { Client, LedgerEntry } from "@prisma/client";
import { addDays, format, isBefore, startOfDay, subMonths } from "date-fns";
import { daysFromToday, isDateBeforeToday, startOfToday } from "@/lib/dates";

export type LedgerType = "DUE" | "PAYMENT";

export type AgingKey = "current" | "d1_30" | "d31_60" | "d61_90" | "d90";

export const AGING_LABELS: Record<AgingKey, string> = {
  current: "Current",
  d1_30: "1–30 days",
  d31_60: "31–60 days",
  d61_90: "61–90 days",
  d90: "90+ days",
};

export const AGING_COLORS: Record<AgingKey, string> = {
  current: "#2EC4B6",
  d1_30: "#38BDF8",
  d31_60: "#F59E0B",
  d61_90: "#F97316",
  d90: "#EF4444",
};

export type ClientWithEntries = Client & { entries: LedgerEntry[] };

export type RunningLine = {
  entry: LedgerEntry;
  due: number;
  paid: number;
  balance: number;
};

export type OpenDue = {
  entry: LedgerEntry;
  remaining: number;
  ageDays: number;
  bucket: AgingKey;
};

export function sortEntries(entries: LedgerEntry[]) {
  return [...entries].sort((a, b) => {
    const byDate = a.date.getTime() - b.date.getTime();
    if (byDate !== 0) return byDate;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function runningLedger(entries: LedgerEntry[]): RunningLine[] {
  let balance = 0;
  return sortEntries(entries).map((entry) => {
    const due = entry.type === "DUE" ? entry.amount : 0;
    const paid = entry.type === "PAYMENT" ? entry.amount : 0;
    balance += due - paid;
    return { entry, due, paid, balance };
  });
}

export function totals(entries: LedgerEntry[]) {
  const totalDue = entries
    .filter((entry) => entry.type === "DUE")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaid = entries
    .filter((entry) => entry.type === "PAYMENT")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return {
    totalDue,
    totalPaid,
    outstanding: totalDue - totalPaid,
  };
}

export function agingBucket(ageDays: number): AgingKey {
  if (ageDays <= 0) return "current";
  if (ageDays <= 30) return "d1_30";
  if (ageDays <= 60) return "d31_60";
  if (ageDays <= 90) return "d61_90";
  return "d90";
}

export function openDues(entries: LedgerEntry[]): OpenDue[] {
  const chronological = sortEntries(entries);
  const dues = chronological.filter((entry) => entry.type === "DUE");
  let remainingPayments = chronological
    .filter((entry) => entry.type === "PAYMENT")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const today = startOfToday();

  return dues
    .map((entry) => {
      const applied = Math.min(entry.amount, remainingPayments);
      remainingPayments -= applied;
      const remaining = entry.amount - applied;
      const ageDays = Math.max(
        0,
        Math.round((today.getTime() - startOfDay(entry.date).getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        entry,
        remaining,
        ageDays,
        bucket: agingBucket(ageDays),
      };
    })
    .filter((due) => due.remaining > 0);
}

export function emptyAging() {
  return {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d61_90: 0,
    d90: 0,
  } satisfies Record<AgingKey, number>;
}

export function agingFromEntries(entries: LedgerEntry[]) {
  const buckets = emptyAging();
  for (const due of openDues(entries)) {
    buckets[due.bucket] += due.remaining;
  }
  return buckets;
}

export function promisedToward(client: Pick<Client, "nextPromisedAmount">, outstanding: number) {
  if (outstanding <= 0) return 0;
  const amount = client.nextPromisedAmount;
  if (amount == null || amount <= 0) return outstanding;
  return Math.min(amount, outstanding);
}

export function clientStatus(client: ClientWithEntries) {
  const { totalDue, totalPaid, outstanding } = totals(client.entries);
  const lastPayment = sortEntries(client.entries)
    .filter((entry) => entry.type === "PAYMENT")
    .at(-1);
  const lastDue = sortEntries(client.entries)
    .filter((entry) => entry.type === "DUE")
    .at(-1);
  const promised = client.nextPromisedDate;
  const open = Math.max(outstanding, 0);
  const promisedAmount = promised && open > 0 ? promisedToward(client, open) : 0;
  const promisedPartial = promisedAmount > 0 && promisedAmount < open;
  const overdue = open > 0 && isDateBeforeToday(promised);
  const dueToday = open > 0 && promised
    ? daysFromToday(promised) === 0
    : false;
  const credit = outstanding < 0 ? Math.abs(outstanding) : 0;

  return {
    totalDue,
    totalPaid,
    outstanding: open,
    credit,
    lastPayment,
    lastDue,
    promised,
    promisedAmount,
    promisedPartial,
    overdue,
    dueToday,
    daysOverdue: overdue ? Math.abs(daysFromToday(promised)) : 0,
    aging: agingFromEntries(client.entries),
    oldestOpenDue: openDues(client.entries)[0] ?? null,
  };
}

export function isPromisedSoon(date?: Date | null, withinDays = 14) {
  if (!date) return false;
  const today = startOfToday();
  const windowEnd = addDays(today, withinDays);
  const promised = startOfDay(date);
  return !isBefore(promised, today) && !isBefore(windowEnd, promised);
}

export function companySnapshot(clients: ClientWithEntries[]) {
  const statuses = clients.map((client) => ({
    client,
    status: clientStatus(client),
  }));

  const withDues = statuses.filter((item) => item.status.outstanding > 0);
  const overdue = withDues.filter((item) => item.status.overdue);
  const dueToday = withDues.filter((item) => item.status.dueToday);
  const upcoming = withDues.filter(
    (item) => item.status.promised && isPromisedSoon(item.status.promised) && !item.status.overdue,
  );

  const aging = emptyAging();
  for (const item of withDues) {
    for (const key of Object.keys(aging) as AgingKey[]) {
      aging[key] += item.status.aging[key];
    }
  }

  const monthStart = new Date(startOfToday());
  monthStart.setUTCDate(1);

  const collectedThisMonth = clients.reduce((sum, client) => {
    return (
      sum +
      client.entries
        .filter((entry) => entry.type === "PAYMENT" && !isBefore(startOfDay(entry.date), monthStart))
        .reduce((inner, entry) => inner + entry.amount, 0)
    );
  }, 0);

  const billedThisMonth = clients.reduce((sum, client) => {
    return (
      sum +
      client.entries
        .filter((entry) => entry.type === "DUE" && !isBefore(startOfDay(entry.date), monthStart))
        .reduce((inner, entry) => inner + entry.amount, 0)
    );
  }, 0);

  return {
    clientCount: clients.length,
    totalOutstanding: withDues.reduce((sum, item) => sum + item.status.outstanding, 0),
    clientsWithDues: withDues.length,
    overdueAmount: overdue.reduce((sum, item) => sum + item.status.outstanding, 0),
    overdueCount: overdue.length,
    dueTodayAmount: dueToday.reduce((sum, item) => sum + item.status.outstanding, 0),
    dueTodayCount: dueToday.length,
    upcomingAmount: upcoming.reduce((sum, item) => sum + item.status.promisedAmount, 0),
    upcomingCount: upcoming.length,
    collectedThisMonth,
    billedThisMonth,
    aging,
    overdueClients: overdue
      .sort((a, b) => b.status.outstanding - a.status.outstanding)
      .map((item) => ({ ...item.client, status: item.status })),
    upcomingClients: upcoming
      .sort((a, b) => (a.status.promised?.getTime() ?? 0) - (b.status.promised?.getTime() ?? 0))
      .map((item) => ({ ...item.client, status: item.status })),
    topOutstanding: withDues
      .sort((a, b) => b.status.outstanding - a.status.outstanding)
      .slice(0, 8)
      .map((item) => ({ ...item.client, status: item.status })),
    monthly: monthlySeries(clients, 6),
    mix: {
      overdue: overdue.reduce((sum, item) => sum + item.status.outstanding, 0),
      upcoming: upcoming.reduce((sum, item) => sum + item.status.promisedAmount, 0),
      later: Math.max(
        0,
        withDues.reduce((sum, item) => sum + item.status.outstanding, 0)
          - overdue.reduce((sum, item) => sum + item.status.outstanding, 0)
          - upcoming.reduce((sum, item) => sum + item.status.promisedAmount, 0),
      ),
    },
    settledCount: clients.length - withDues.length,
  };
}

export function monthlySeries(clients: ClientWithEntries[], months = 6) {
  const today = startOfToday();
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = subMonths(today, months - 1 - index);
    return {
      key: format(date, "yyyy-MM"),
      label: format(date, "MMM"),
      billed: 0,
      collected: 0,
    };
  });
  const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const client of clients) {
    for (const entry of client.entries) {
      const bucket = map.get(format(entry.date, "yyyy-MM"));
      if (!bucket) continue;
      if (entry.type === "DUE") bucket.billed += entry.amount;
      else bucket.collected += entry.amount;
    }
  }

  return buckets;
}

export function whatsappHref(phone: string, message?: string) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`;
  else if (digits.length === 10) digits = `880${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
