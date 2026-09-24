import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InvoiceShell } from "@/components/invoice-shell";

export const metadata: Metadata = {
  title: "Invoices",
};

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default function InvoicesLayout({ children }: { children: ReactNode }) {
  return <InvoiceShell>{children}</InvoiceShell>;
}
