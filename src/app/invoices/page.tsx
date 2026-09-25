import { Suspense } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CubityStampLoader } from "@/components/cubity-stamp-loader";
import { InvoiceList, type InvoiceGroup } from "@/components/invoice-list";
import { addDaysToInput, DHAKA_TZ, formatDateLong, todayInputValue } from "@/lib/dates";
import { getInvoices, invoiceTotal } from "@/lib/invoice-queries";
import { invoices } from "@/lib/routes";

function dhakaDay(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: DHAKA_TZ });
}

async function InvoiceGroups() {
  const rows = await getInvoices();
  const today = todayInputValue();
  const yesterday = addDaysToInput(-1);

  const groups = new Map<string, InvoiceGroup>();
  for (const invoice of [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    const day = dhakaDay(invoice.createdAt);
    const label = day === today ? "Today" : day === yesterday ? "Yesterday" : formatDateLong(day);
    const group = groups.get(day) ?? { day, label, items: [] };
    group.items.push({
      id: invoice.id,
      number: invoice.number,
      clientName: invoice.clientName,
      billed: invoiceTotal(invoice.lines),
    });
    groups.set(day, group);
  }

  return (
    <div className="grid gap-8">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {rows.length} {rows.length === 1 ? "invoice" : "invoices"}, newest first
      </p>
      {rows.length === 0 ? (
        <Empty className="border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No invoices yet</EmptyTitle>
            <EmptyDescription>Pick services, enter amounts, and Cubity will write the invoice.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={invoices.new}>New invoice</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <InvoiceList groups={[...groups.values()]} />
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-2 md:max-w-2xl">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Billing</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Invoices</h1>
      </div>
      <Suspense fallback={<CubityStampLoader />}>
        <InvoiceGroups />
      </Suspense>
    </div>
  );
}
