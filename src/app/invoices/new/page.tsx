import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">New</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Invoice</h1>
      </div>
      <InvoiceForm />
    </div>
  );
}
