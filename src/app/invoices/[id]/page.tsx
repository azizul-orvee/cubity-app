import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgePercent, CopyPlus, FileDown, Pencil, UserPlus, Wallet } from "lucide-react";
import { DeleteInvoiceButton } from "@/components/delete-buttons";
import { InvoicePaper } from "@/components/invoice-paper";
import { InvoicePayments } from "@/components/invoice-payments";
import { PdfDownload } from "@/components/pdf-download";
import { formatMoney } from "@/lib/money";
import { getInvoice, invoiceBill, invoiceDue } from "@/lib/invoice-queries";
import { getPaymentInstructions } from "@/lib/queries";
import { invoices, receivables } from "@/lib/routes";
import { canEditReceivables } from "@/lib/workspace-role";

const actionClass =
  "flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-[1.35rem] bg-white px-2 text-sm font-semibold ring-1 ring-border";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, payment, canEdit] = await Promise.all([
    getInvoice(id),
    getPaymentInstructions(),
    canEditReceivables(),
  ]);
  if (!invoice) notFound();
  const bill = invoiceBill(invoice);
  const onLedger = invoice.ledgerEntries.length > 0;

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6">
      <div>
        <Link href={invoices.root} className="text-sm font-medium text-primary">
          Invoices
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight break-words">{invoice.clientName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href={invoices.edit(invoice.id)} className={actionClass}>
          <Pencil className="size-5" />
          Edit
        </Link>
        <Link href={invoices.discount(invoice.id)} className={actionClass}>
          <BadgePercent className="size-5" />
          Discount
          <span className="text-xs font-medium text-[#0F766E]">
            {bill.discount > 0 ? formatMoney(bill.discount) : "None yet"}
          </span>
        </Link>
        <Link href={invoices.newFrom(invoice.id)} className={actionClass}>
          <CopyPlus className="size-5" />
          New from this
        </Link>
        <PdfDownload
          href={invoices.pdf(invoice.id)}
          title="Download invoice PDF?"
          description="This saves a Cubity invoice with the same letterhead as a due statement."
          className="flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-[1.35rem] bg-primary text-sm font-semibold text-primary-foreground"
        >
          <FileDown className="size-5" />
          Download
        </PdfDownload>
      </div>

      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <h2 className="text-lg font-semibold tracking-tight">Client ledger</h2>
        {invoice.client ? (
          <>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Linked to{" "}
              <Link href={receivables.client(invoice.client.id)} className="font-medium text-primary">
                {invoice.client.name}
              </Link>
              {onLedger
                ? ". This bill is on their ledger, so it counts towards what they owe."
                : ". Not on their ledger yet, so it is not counted in what they owe."}
            </p>
            {canEdit ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {onLedger ? null : (
                  <Link
                    href={invoices.ledger(invoice.id)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
                  >
                    <Wallet className="size-4" />
                    Add to the ledger
                  </Link>
                )}
                <Link
                  href={invoices.client(invoice.id)}
                  className="inline-flex min-h-12 items-center rounded-2xl bg-white px-5 text-sm font-medium ring-1 ring-border"
                >
                  Change client
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Not linked to a receivables client, so this bill is not counted in what anyone owes. You
              can add them as a new client from the invoice details, or point it at someone already on
              the ledger.
            </p>
            {canEdit ? (
              <Link
                href={invoices.client(invoice.id)}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold ring-1 ring-border"
              >
                <UserPlus className="size-4" />
                Add or link a client
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                The accountant can link it from Receivables.
              </p>
            )}
          </>
        )}
      </section>

      <InvoicePayments invoiceId={invoice.id} due={invoiceDue(invoice)} payments={invoice.payments} />

      <InvoicePaper invoice={invoice} payment={payment} />

      <div className="flex justify-center pb-4">
        <DeleteInvoiceButton invoiceId={invoice.id} name={invoice.clientName} />
      </div>
    </div>
  );
}
