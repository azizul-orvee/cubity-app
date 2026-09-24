import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown, MessageCircle, Pencil, Phone } from "lucide-react";
import { DeleteInvoiceButton } from "@/components/delete-buttons";
import { InvoiceStatusBadge, invoiceStatus } from "@/components/invoice-ui";
import { PdfDownload } from "@/components/pdf-download";
import { formatDate } from "@/lib/dates";
import { getInvoice, invoiceDue, invoiceTotal } from "@/lib/invoice-queries";
import { telHref, whatsappHref } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { invoices } from "@/lib/routes";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const total = invoiceTotal(invoice.lines);
  const due = invoiceDue(invoice);
  const paidPercent = total > 0 ? Math.min(invoice.paidAmount / total, 1) : 0;

  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-8">
      <div>
        <Link href={invoices.root} className="text-sm font-medium text-primary">
          Invoices
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
            <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight break-words">
              {invoice.clientName}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {formatDate(invoice.issueDate)}
              {invoice.projectName ? ` · ${invoice.projectName}` : ""}
            </p>
            <div className="mt-3">
              <InvoiceStatusBadge status={invoiceStatus(total, invoice.paidAmount)} />
            </div>
          </div>
          <Link
            href={invoices.edit(invoice.id)}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white ring-1 ring-border"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit invoice</span>
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0F766E] via-[#128C86] to-[#7DD3FC] px-6 py-7 text-white shadow-[0_18px_40px_rgba(15,118,110,0.22)]">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">Amount due</p>
        <p className="mt-3 text-[2.35rem] leading-none font-semibold tracking-tight">{formatMoney(Math.max(due, 0))}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${paidPercent * 100}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/85">
          Paid {formatMoney(invoice.paidAmount)} of {formatMoney(total)} billed
        </p>
      </section>

      {invoice.clientPhone ? (
        <div className="grid grid-cols-2 gap-3">
          <Action href={telHref(invoice.clientPhone)} icon={<Phone className="size-5" />} label="Call" />
          <Action
            href={whatsappHref(invoice.clientPhone, "Assalamualaikum")}
            icon={<MessageCircle className="size-5" />}
            label="WhatsApp"
            external
          />
        </div>
      ) : null}

      <PdfDownload
        href={invoices.pdf(invoice.id)}
        title="Download invoice PDF?"
        description="This saves a Cubity invoice with the same letterhead as a due statement."
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
      >
        <FileDown className="size-4" />
        Download invoice PDF
      </PdfDownload>

      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <h2 className="text-lg font-semibold tracking-tight">Services</h2>
        <p className="mt-1 mb-5 text-sm leading-relaxed text-muted-foreground">
          {invoice.lines.length} {invoice.lines.length === 1 ? "service" : "services"} on this invoice.
        </p>
        <div className="grid gap-3">
          {invoice.lines.map((line) => (
            <article key={line.id} className="flex items-start justify-between gap-4 rounded-2xl bg-[#F6FAFA] px-4 py-4">
              <p className="min-w-0 font-medium leading-snug">{line.serviceName}</p>
              <p className="shrink-0 font-semibold tabular-nums text-indigo-700">{formatMoney(line.amount)}</p>
            </article>
          ))}
        </div>
        <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Billed</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="font-semibold tabular-nums text-teal-700">− {formatMoney(invoice.paidAmount)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base">
            <dt className="font-semibold">Still due</dt>
            <dd className="font-semibold tabular-nums text-[#0F766E]">{formatMoney(Math.max(due, 0))}</dd>
          </div>
        </dl>
      </section>

      {invoice.clientPhone || invoice.clientAddress || invoice.notes ? (
        <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
          <h2 className="text-lg font-semibold tracking-tight">Client</h2>
          <dl className="mt-5 grid gap-5 text-sm">
            {invoice.clientPhone ? <Detail label="Phone">{invoice.clientPhone}</Detail> : null}
            {invoice.clientAddress ? <Detail label="Address">{invoice.clientAddress}</Detail> : null}
            {invoice.notes ? <Detail label="Notes">{invoice.notes}</Detail> : null}
          </dl>
        </section>
      ) : null}

      <div className="flex justify-center pt-2 pb-4">
        <DeleteInvoiceButton invoiceId={invoice.id} name={invoice.clientName} />
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1.5 text-base leading-relaxed text-muted-foreground">{children}</dd>
    </div>
  );
}

function Action({ href, icon, label, external }: { href: string; icon: ReactNode; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex min-h-[5rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] bg-white text-sm font-semibold ring-1 ring-border"
    >
      {icon}
      {label}
    </a>
  );
}
