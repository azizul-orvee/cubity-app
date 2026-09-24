import { notFound } from "next/navigation";
import Link from "next/link";
import { PdfDownload } from "@/components/pdf-download";
import { deleteInvoice } from "@/lib/invoice-actions";
import { formatDate } from "@/lib/dates";
import { getInvoice, invoiceDue, invoiceTotal } from "@/lib/invoice-queries";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const total = invoiceTotal(invoice.lines);
  const due = invoiceDue(invoice);
  const remove = deleteInvoice.bind(null, invoice.id);

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">{invoice.clientName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</p>
      </div>

      <div className="rounded-[1.75rem] bg-[#128C86] p-6 text-white shadow-[0_16px_40px_rgba(18,140,134,0.28)]">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">Amount due</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{formatMoney(due)}</p>
        <p className="mt-2 text-sm text-white/80">
          Billed {formatMoney(total)} · Paid {formatMoney(invoice.paidAmount)}
        </p>
      </div>

      <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]">
        <ul className="grid gap-4">
          {invoice.lines.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm leading-snug">{line.serviceName}</p>
              <p className="shrink-0 text-sm font-semibold">{formatMoney(line.amount)}</p>
            </li>
          ))}
        </ul>
      </section>

      {invoice.projectName || invoice.clientPhone || invoice.clientAddress || invoice.notes ? (
        <section className="grid gap-2 rounded-[1.75rem] bg-white p-5 text-sm leading-relaxed text-muted-foreground ring-1 ring-black/[0.06]">
          {invoice.projectName ? <p>Project: {invoice.projectName}</p> : null}
          {invoice.clientPhone ? <p>{invoice.clientPhone}</p> : null}
          {invoice.clientAddress ? <p>{invoice.clientAddress}</p> : null}
          {invoice.notes ? <p>{invoice.notes}</p> : null}
        </section>
      ) : null}

      <PdfDownload
        href={invoices.pdf(invoice.id)}
        title="Download invoice PDF?"
        description="This saves a Cubity invoice with the same letterhead as a due statement."
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
      >
        Download PDF
      </PdfDownload>

      <Link
        href={invoices.edit(invoice.id)}
        className="flex h-14 items-center justify-center rounded-2xl bg-white text-base font-medium ring-1 ring-border"
      >
        Edit invoice
      </Link>

      <form action={remove}>
        <button type="submit" className="h-12 w-full text-sm font-medium text-destructive">
          Delete invoice
        </button>
      </form>
    </div>
  );
}
