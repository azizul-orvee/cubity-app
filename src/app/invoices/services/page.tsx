import { ServiceEditor } from "@/components/service-editor";

export default function InvoiceServicesPage() {
  return (
    <div className="mx-auto grid max-w-lg grid-cols-1 gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Catalog</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Services</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          This list stays on this phone. Rename, remove, or add a service. It is not saved to the office database until you put it on an invoice.
        </p>
      </div>
      <ServiceEditor />
    </div>
  );
}
