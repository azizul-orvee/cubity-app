"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InvoiceAvatar, InvoiceStatusBadge, invoiceStatus, type InvoiceStatus } from "@/components/invoice-ui";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export type InvoiceListItem = {
  id: string;
  number: string;
  clientName: string;
  issueDate: string;
  billed: number;
  paid: number;
};

const FILTERS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partly paid" },
  { value: "paid", label: "Paid" },
];

export function InvoiceList({ items }: { items: InvoiceListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && invoiceStatus(item.billed, item.paid) !== filter) return false;
      if (!q) return true;
      return item.clientName.toLowerCase().includes(q) || item.number.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid gap-4">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search client or invoice number"
            enterKeyHint="search"
            className="h-14 rounded-2xl pl-11"
          />
        </div>
        <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={
                filter === item.value
                  ? "inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                  : "inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-5 text-sm font-medium text-muted-foreground ring-1 ring-border"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[1.75rem] bg-white px-6 py-8 text-center text-sm text-muted-foreground ring-1 ring-black/[0.06]">
          No matching invoices. Try another search or filter.
        </p>
      ) : (
        <div className="grid gap-3">
          {rows.map((row, index) => {
            const status = invoiceStatus(row.billed, row.paid);
            return (
              <Link
                key={row.id}
                href={invoices.invoice(row.id)}
                className="flex items-start gap-4 rounded-[1.5rem] bg-white px-5 py-5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(15,40,40,0.04)]"
              >
                <InvoiceAvatar name={row.clientName} index={index} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-[17px] font-semibold tracking-tight">{row.clientName}</p>
                    <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-[#0F766E]">
                      {formatMoney(Math.max(row.billed - row.paid, 0))}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {row.number} · {formatDate(row.issueDate)}
                  </p>
                  <div className="mt-2.5">
                    <InvoiceStatusBadge status={status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
