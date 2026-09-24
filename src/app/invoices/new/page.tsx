import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">New invoice</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Write an invoice</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Client name and at least one service are enough. Phone and address if you have them.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
