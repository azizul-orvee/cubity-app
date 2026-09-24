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
import { InvoiceList } from "@/components/invoice-list";
import { getInvoices, invoiceDue, invoiceTotal } from "@/lib/invoice-queries";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export default async function InvoicesPage() {
  const rows = await getInvoices();
  const outstanding = rows.reduce((sum, invoice) => sum + invoiceDue(invoice), 0);
  const billed = rows.reduce((sum, invoice) => sum + invoiceTotal(invoice.lines), 0);
  const collected = billed - outstanding;
  const paidPercent = billed > 0 ? Math.min(collected / billed, 1) : 0;
  const open = rows.filter((invoice) => invoiceDue(invoice) > 0).length;

  const items = rows.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    clientName: invoice.clientName,
    issueDate: invoice.issueDate.toISOString(),
    billed: invoiceTotal(invoice.lines),
    paid: invoice.paidAmount,
  }));

  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-8 md:max-w-2xl">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Billing</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Invoices</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {rows.length} {rows.length === 1 ? "invoice" : "invoices"} written by Cubity
        </p>
      </div>

      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0F766E] via-[#128C86] to-[#7DD3FC] px-6 py-7 text-white shadow-[0_18px_40px_rgba(15,118,110,0.22)]">
        <div className="absolute -top-10 -right-8 size-36 rounded-full bg-white/15" />
        <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-cyan-200/20" />
        <p className="relative text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">Still due</p>
        <p className="relative mt-3 text-[2.35rem] leading-none font-semibold tracking-tight">{formatMoney(outstanding)}</p>
        <div className="relative mt-6 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${paidPercent * 100}%` }} />
        </div>
        <p className="relative mt-3 text-sm leading-relaxed text-white/85">
          Paid {formatMoney(collected)} of {formatMoney(billed)} billed
        </p>
        <div className="relative mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/75">Open invoices</p>
            <p className="text-lg font-semibold">{open}</p>
          </div>
          <div className="rounded-2xl bg-black/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/75">Collected</p>
            <p className="text-lg font-semibold">{formatMoney(collected)}</p>
          </div>
        </div>
      </section>

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
        <InvoiceList items={items} />
      )}
    </div>
  );
}
