import { notFound } from "next/navigation";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoice-form";
import { getInvoice } from "@/lib/invoice-queries";
import { invoices } from "@/lib/routes";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-7">
      <div>
        <Link href={invoices.invoice(invoice.id)} className="text-sm font-medium text-primary">
          Back to invoice
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Edit invoice</h1>
      </div>
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
