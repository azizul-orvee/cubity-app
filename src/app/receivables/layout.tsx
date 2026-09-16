import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Receivables",
};

export default function ReceivablesLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
