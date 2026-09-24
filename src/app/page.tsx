import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Wallet } from "lucide-react";
import { RoleGate } from "@/components/role-gate";
import { SiteChrome } from "@/components/site-chrome";
import { COMPANY } from "@/lib/company";
import { invoices, receivables } from "@/lib/routes";
import { getWorkspaceRole } from "@/lib/workspace-role";

export const metadata: Metadata = {
  title: "Workspace",
};

const products = [
  {
    href: receivables.root,
    title: "Receivables",
    copy: "Track client dues, partial payments, promised dates, and statements.",
    icon: Wallet,
    ready: true,
  },
  {
    href: invoices.root,
    title: "Invoice maker",
    copy: "Write a Cubity invoice, pick services, and download the PDF.",
    icon: FileText,
    ready: true,
  },
] as const;

export default async function HubPage() {
  const role = await getWorkspaceRole();
  return (
    <SiteChrome>
      <div className="mx-auto grid max-w-lg gap-8 md:max-w-3xl">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            {COMPANY.city}
          </p>
          <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">
            Cubity workspace
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Pick a tool. More Cubity products will land here.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => {
            const Icon = product.icon;
            const card = (
              <>
                <span className="grid size-14 place-items-center rounded-full bg-[#128C86] text-white">
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  {product.ready ? "Open" : "Coming next"}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{product.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.copy}</p>
              </>
            );
            const cardClass =
              "w-full rounded-[1.75rem] bg-white p-6 text-left ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(15,40,40,0.04)]";

            if (product.href === receivables.root && !role) {
              return (
                <RoleGate key={product.href}>
                  <button type="button" className={cardClass}>
                    {card}
                  </button>
                </RoleGate>
              );
            }

            return (
              <Link key={product.href} href={product.href} className={cardClass}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </SiteChrome>
  );
}
