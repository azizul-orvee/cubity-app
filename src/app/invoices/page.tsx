import Link from "next/link";
import { FileText } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { getInvoices, invoiceDue } from "@/lib/invoice-queries";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export default async function InvoicesPage() {
  const rows = await getInvoices();
  const outstanding = rows.reduce((sum, invoice) => sum + invoiceDue(invoice), 0);

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Cubity</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Invoices</h1>
      </div>

      <div className="rounded-[1.75rem] bg-[#128C86] p-6 text-white shadow-[0_16px_40px_rgba(18,140,134,0.28)]">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">Still due</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{formatMoney(outstanding)}</p>
        <p className="mt-2 text-sm text-white/80">
          {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[1.75rem] bg-white p-8 text-center ring-1 ring-black/[0.06]">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#128C86] text-white">
            <FileText className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No invoices yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pick services, enter amounts, and Cubity will write the invoice.
          </p>
          <Link
            href={invoices.new}
            className="mt-5 inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            New invoice
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={invoices.invoice(invoice.id)}
                className="block rounded-[1.5rem] bg-white p-5 ring-1 ring-black/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{invoice.clientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.number} · {formatDate(invoice.issueDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-semibold text-[#128C86]">
                    {formatMoney(invoiceDue(invoice))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
