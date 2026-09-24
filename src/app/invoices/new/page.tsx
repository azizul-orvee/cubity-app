import { InvoiceForm } from "@/components/invoice-form";
import { getInvoice } from "@/lib/invoice-queries";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const template = from ? await getInvoice(from) : null;

  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">New invoice</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Write an invoice</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {template
            ? `Filled in from ${template.number}. Give it a new invoice ID and change what you need. ${template.number} stays as it is.`
            : "Invoice ID, client name, and at least one service are required. Phone and address if you have them."}
        </p>
      </div>
      <InvoiceForm template={template ?? undefined} />
    </div>
  );
}
