import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceClientForm } from "@/components/invoice-client-form";
import { getInvoice } from "@/lib/invoice-queries";
import { getClientOptions } from "@/lib/queries";
import { invoices } from "@/lib/routes";
import { redirectUnlessAccountant } from "@/lib/workspace-role";

export default async function InvoiceClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await redirectUnlessAccountant(invoices.invoice(id));

  const [invoice, clients] = await Promise.all([getInvoice(id), getClientOptions()]);
  if (!invoice) notFound();

  return (
    <div className="mx-auto grid max-w-lg gap-7">
      <div>
        <Link href={invoices.invoice(invoice.id)} className="text-sm font-medium text-primary">
          Back to invoice
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Link a client</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Billed to {invoice.clientName}. Linking the bill to a receivables client lets you put it on
          their ledger, and puts the invoice number on their due statement.
        </p>
      </div>
      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <InvoiceClientForm
          invoiceId={invoice.id}
          clients={clients}
          currentClientId={invoice.clientId}
          suggestedName={invoice.clientName}
        />
      </section>
    </div>
  );
}
