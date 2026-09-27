import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgePercent, CopyPlus, FileDown, Lock, Pencil, UserPlus, Wallet } from "lucide-react";
import { DeleteInvoiceButton } from "@/components/delete-buttons";
import { InvoicePaper } from "@/components/invoice-paper";
import { InvoicePayments } from "@/components/invoice-payments";
import { PdfDownload } from "@/components/pdf-download";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getInvoice, invoiceBill, invoiceDue } from "@/lib/invoice-queries";
import { getPaymentInstructions } from "@/lib/queries";
import { invoices, receivables } from "@/lib/routes";
import { canEditReceivables } from "@/lib/workspace-role";

const actionClass =
  "cb-tap flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-[1.35rem] bg-white px-2 text-sm font-semibold ring-1 ring-border";

function LedgerAction({
  href,
  canEdit,
  primary,
  children,
}: {
  href: string;
  canEdit: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold",
    primary
      ? "bg-primary text-primary-foreground cb-tap"
      : "bg-white font-medium ring-1 ring-border cb-tap",
  );
  if (!canEdit) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

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
    <div className="cb-stagger mx-auto grid max-w-2xl grid-cols-1 gap-6">
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
          className="cb-tap flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-[1.35rem] bg-primary text-sm font-semibold text-primary-foreground"
        >
          <FileDown className="size-5" />
          Download
        </PdfDownload>
      </div>

      <section className="cb-rise rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Client ledger</h2>
          {canEdit ? null : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F6FAFA] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              <Lock className="size-3" />
              CEO only
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {invoice.client ? (
            <>
              Linked to{" "}
              {canEdit ? (
                <Link href={receivables.client(invoice.client.id)} className="font-medium text-primary">
                  {invoice.client.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{invoice.client.name}</span>
              )}
              {onLedger
                ? ". This bill is on their ledger, so it counts towards what they owe."
                : ". Not on their ledger yet, so it is not counted in what they owe."}
            </>
          ) : (
            <>
              Not linked to a receivables client, so this bill is not counted in what anyone owes. It can
              be linked to a new client made from these invoice details, or to someone already on the
              ledger.
            </>
          )}
        </p>

        {/* Engineers and anyone without a role see the controls greyed out, so it
            is clear the step exists and who does it, rather than simply missing. */}
        <div
          className={cn("mt-5 flex flex-wrap gap-3", canEdit ? null : "pointer-events-none opacity-45 grayscale")}
          aria-hidden={canEdit ? undefined : true}
        >
          {onLedger ? null : invoice.client ? (
            <LedgerAction href={invoices.ledger(invoice.id)} canEdit={canEdit} primary>
              <Wallet className="size-4" />
              Add to the ledger
            </LedgerAction>
          ) : (
            <LedgerAction href={invoices.client(invoice.id)} canEdit={canEdit}>
              <UserPlus className="size-4" />
              Add or link a client
            </LedgerAction>
          )}
          {invoice.client ? (
            <LedgerAction href={invoices.client(invoice.id)} canEdit={canEdit}>
              Change client
            </LedgerAction>
          ) : null}
        </div>

        {canEdit ? null : (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ask the CEO to create the link. Anyone can write an invoice, but putting a bill on a
            client&apos;s ledger changes what the office is owed, so it needs the CEO.
          </p>
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
