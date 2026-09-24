"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FileText, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { hubPath, invoices, isInvoiceFormPath } from "@/lib/routes";

const tabs = [
  { href: invoices.root, label: "Invoices", icon: FileText },
  { href: invoices.services, label: "Services", icon: Sparkles },
];

function NavTab({
  pathname,
  href,
  label,
  icon: Icon,
}: {
  pathname: string;
  href: string;
  label: string;
  icon: typeof FileText;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === invoices.root) return pathname === invoices.root;
  return pathname.startsWith(href);
}

export function InvoiceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const formScreen = isInvoiceFormPath(pathname);

  return (
    <div className="app-shell min-h-dvh overflow-x-clip bg-[radial-gradient(120%_80%_at_0%_-10%,rgba(46,196,182,0.22),transparent_42%),radial-gradient(90%_60%_at_100%_0%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,#f4fbfb_0%,#eef6f6_100%)]">
      <header className="app-header sticky top-0 z-40 border-b border-border bg-white">
        <div className="app-header-inner mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)]">
          <Link href={hubPath} className="flex min-h-11 items-center gap-2">
            <Image
              src="/cubity-logo.jpg"
              alt="Cubity"
              width={36}
              height={36}
              className="size-9 rounded-full ring-1 ring-border"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-[0.14em] text-foreground">CUBITY</span>
              <span className="block text-[11px] text-muted-foreground">Invoices</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium",
                  isActive(pathname, tab.href) ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </Link>
            ))}
            <Link
              href={invoices.new}
              className="ml-2 inline-flex min-h-10 items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Plus className="size-4" />
              New invoice
            </Link>
          </nav>
        </div>
      </header>

      <main
        className={cn(
          "app-main mx-auto w-full min-w-0 max-w-6xl flex-1 px-5 py-6 md:py-10",
          formScreen
            ? "pb-[calc(2rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-10",
        )}
      >
        {children}
      </main>

      {formScreen ? null : (
        <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pt-1">
            <NavTab pathname={pathname} href={invoices.root} label="Invoices" icon={FileText} />
            <Link
              href={invoices.new}
              className="-mt-5 flex flex-col items-center justify-center text-[11px] font-semibold text-primary"
            >
              <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(46,196,182,0.45)]">
                <Plus className="size-6" />
              </span>
              New
            </Link>
            <NavTab pathname={pathname} href={invoices.services} label="Services" icon={Sparkles} />
          </div>
        </nav>
      )}
    </div>
  );
}
