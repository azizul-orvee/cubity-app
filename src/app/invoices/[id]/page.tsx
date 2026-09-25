import { notFound } from "next/navigation";
import Link from "next/link";
import { CopyPlus, FileDown, Pencil } from "lucide-react";
import { DeleteInvoiceButton } from "@/components/delete-buttons";
import { InvoicePaper } from "@/components/invoice-paper";
import { InvoicePayments } from "@/components/invoice-payments";
import { PdfDownload } from "@/components/pdf-download";
import { getInvoice, invoiceDue } from "@/lib/invoice-queries";
import { getPaymentInstructions } from "@/lib/queries";
import { invoices } from "@/lib/routes";

const actionClass =
  "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-[1.35rem] bg-white text-sm font-semibold ring-1 ring-border";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, payment] = await Promise.all([getInvoice(id), getPaymentInstructions()]);
  if (!invoice) notFound();

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6">
      <div>
        <Link href={invoices.root} className="text-sm font-medium text-primary">
          Invoices
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight break-words">{invoice.clientName}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href={invoices.edit(invoice.id)} className={actionClass}>
          <Pencil className="size-5" />
          Edit
        </Link>
        <Link href={invoices.newFrom(invoice.id)} className={actionClass}>
          <CopyPlus className="size-5" />
          New from this
        </Link>
        <PdfDownload
          href={invoices.pdf(invoice.id)}
          title="Download invoice PDF?"
          description="This saves a Cubity invoice with the same letterhead as a due statement."
          className="flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-[1.35rem] bg-primary text-sm font-semibold text-primary-foreground"
        >
          <FileDown className="size-5" />
          Download
        </PdfDownload>
      </div>

      <InvoicePayments invoiceId={invoice.id} due={invoiceDue(invoice)} payments={invoice.payments} />

      <InvoicePaper invoice={invoice} payment={payment} />

      <div className="flex justify-center pb-4">
        <DeleteInvoiceButton invoiceId={invoice.id} name={invoice.clientName} />
      </div>
    </div>
  );
}
