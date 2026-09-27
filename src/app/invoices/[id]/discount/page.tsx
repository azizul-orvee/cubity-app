import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscountForm } from "@/components/discount-form";
import { setInvoiceDiscount } from "@/lib/invoice-actions";
import { getInvoice, invoiceBill, invoiceTotal } from "@/lib/invoice-queries";
import { invoices } from "@/lib/routes";

export default async function InvoiceDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const bill = invoiceBill(invoice);

  return (
    <div className="cb-stagger mx-auto grid max-w-lg gap-7">
      <div>
        <Link href={invoices.invoice(invoice.id)} className="text-sm font-medium text-primary">
          Back to invoice
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">{invoice.number}</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Discount</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {invoice.clientName}. This comes off the service total on the screen and in the PDF.
        </p>
      </div>
      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <DiscountForm
          action={setInvoiceDiscount.bind(null, invoice.id)}
          billed={invoiceTotal(invoice.lines)}
          paid={invoice.paidAmount}
          current={bill.discount}
        />
      </section>
    </div>
  );
}
