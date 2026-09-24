"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InvoiceAvatar } from "@/components/invoice-ui";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export type InvoiceGroup = {
  day: string;
  label: string;
  items: { id: string; number: string; clientName: string; billed: number }[];
};

export function InvoiceList({ groups }: { groups: InvoiceGroup[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.clientName.toLowerCase().includes(q) || item.number.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  let avatarIndex = 0;

  return (
    <div className="grid grid-cols-1 gap-8">
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

      {visible.length === 0 ? (
        <p className="rounded-[1.75rem] bg-white px-6 py-8 text-center text-sm text-muted-foreground ring-1 ring-black/[0.06]">
          No matching invoices. Try another name or number.
        </p>
      ) : (
        visible.map((group) => (
          <section key={group.day} className="grid grid-cols-1 gap-3">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{group.label}</h2>
            {group.items.map((row) => (
              <Link
                key={row.id}
                href={invoices.invoice(row.id)}
                className="flex items-center gap-4 rounded-[1.5rem] bg-white px-5 py-4 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(15,40,40,0.04)]"
              >
                <InvoiceAvatar name={row.clientName} index={avatarIndex++} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[17px] leading-snug font-semibold tracking-tight break-words">{row.clientName}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{row.number}</p>
                </div>
                <p className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-[#0F766E]">
                  {formatMoney(row.billed)}
                </p>
                <ChevronRight className="-mr-1 size-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
