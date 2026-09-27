import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InvoiceLedgerForm } from "@/components/invoice-ledger-form";
import { getInvoice, invoiceBill } from "@/lib/invoice-queries";
import { clientStatus } from "@/lib/ledger";
import { getClient } from "@/lib/queries";
import { invoices } from "@/lib/routes";
import { redirectUnlessAccountant } from "@/lib/workspace-role";

export default async function InvoiceLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await redirectUnlessAccountant(invoices.invoice(id));

  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  // Nothing to do without a client, or once the bill is already on the ledger.
  if (!invoice.clientId) redirect(invoices.client(id));
  if (invoice.ledgerEntries.length > 0) redirect(invoices.invoice(id));

  const client = await getClient(invoice.clientId);
  if (!client) redirect(invoices.client(id));

  const bill = invoiceBill(invoice);

  return (
    <div className="cb-stagger mx-auto grid max-w-lg gap-7">
      <div>
        <Link href={invoices.invoice(invoice.id)} className="text-sm font-medium text-primary">
          Back to invoice
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Add to the ledger</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          This puts {invoice.number} on {client.name}&apos;s receivables ledger as a due, with a payment
          for every receipt already on the invoice. Each line carries the invoice number.
        </p>
      </div>
      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <InvoiceLedgerForm
          invoiceId={invoice.id}
          clientName={client.name}
          issueDate={invoice.issueDate}
          net={bill.net}
          paid={invoice.paidAmount}
          clientOutstanding={clientStatus(client).outstanding}
        />
      </section>
    </div>
  );
}
