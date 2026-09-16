import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteChrome } from "@/components/site-chrome";
import { hubPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Invoice maker",
};

export default function InvoicesPage() {
  return (
    <SiteChrome>
      <div className="mx-auto grid max-w-lg place-items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#128C86] text-white">
          <FileText className="size-7" strokeWidth={1.75} />
        </span>
        <p className="mt-6 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
          Coming next
        </p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">
          Invoice maker
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          This workspace is empty on purpose. Cubity invoices will live here beside receivables.
        </p>
        <Button className="mt-8 min-h-12" asChild>
          <Link href={hubPath}>Back to workspace</Link>
        </Button>
      </div>
    </SiteChrome>
  );
}
