import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/role-gate";
import { SiteChrome } from "@/components/site-chrome";
import { getWorkspaceRole } from "@/lib/workspace-role";

export const metadata: Metadata = {
  title: "Receivables",
};

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function ReceivablesLayout({ children }: { children: ReactNode }) {
  const role = await getWorkspaceRole();
  if (!role) {
    return (
      <SiteChrome>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Receivables
          </p>
          <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">
            Choose accountant or engineer
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Accountants can add and edit. Engineers can only view.
          </p>
        </div>
        <RoleGate blocking />
      </SiteChrome>
    );
  }

  return <AppShell canEdit={role === "accountant"}>{children}</AppShell>;
}
