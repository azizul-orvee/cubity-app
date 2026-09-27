import { Suspense } from "react";
import { CubityStampLoader } from "@/components/cubity-stamp-loader";
import { ServiceEditor } from "@/components/service-editor";
import { ServiceImport } from "@/components/service-import";
import { getServices } from "@/lib/service-queries";

async function Catalog() {
  const services = await getServices();
  return (
    <div className="grid gap-6">
      <ServiceImport knownNames={services.map((service) => service.name)} />
      <ServiceEditor services={services} />
    </div>
  );
}

export default function InvoiceServicesPage() {
  return (
    <div className="cb-stagger mx-auto grid max-w-lg grid-cols-1 gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Catalog</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Services</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The office list, shared by every phone. Rename, remove, or add a service, and give it the
          amount you usually charge. Invoices already sent keep the name and amount they were written
          with.
        </p>
      </div>
      <Suspense fallback={<CubityStampLoader />}>
        <Catalog />
      </Suspense>
    </div>
  );
}
