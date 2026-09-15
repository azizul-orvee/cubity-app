"use client";

import Link from "next/link";
import { FileDown, LayoutDashboard, Plus, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const tabs = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function hideBottomNav(pathname: string) {
  if (pathname === "/clients/new") return true;
  return /^\/clients\/[^/]+\/(edit|due|pay)$/.test(pathname);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const formScreen = hideBottomNav(pathname);

  return (
    <div className="app-shell min-h-dvh overflow-x-clip bg-[radial-gradient(120%_80%_at_0%_-10%,rgba(46,196,182,0.22),transparent_42%),radial-gradient(90%_60%_at_100%_0%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,#f4fbfb_0%,#eef6f6_100%)]">
      <header className="app-header sticky top-0 z-40 border-b border-border bg-white">
        <div className="app-header-inner mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)]">
          <Link href="/" className="flex min-h-11 items-center gap-2">
            <Image
              src="/cubity-logo.jpg"
              alt="Cubity"
              width={36}
              height={36}
              className="size-9 rounded-full ring-1 ring-border"
              priority
            />
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-[0.14em] text-foreground">
                CUBITY
              </span>
              <span className="block text-[11px] text-muted-foreground">Receivables</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <Button
                key={tab.href}
                variant={isActive(pathname, tab.href) ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={tab.href}>{tab.label}</Link>
              </Button>
            ))}
          </nav>
          <Button className="hidden min-h-10 md:inline-flex" asChild>
            <Link href="/clients/new">
              <Plus className="size-4" />
              New client
            </Link>
          </Button>
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
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            );
          })}
          <a
            href="/reports/outstanding"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <FileDown className="size-5" />
            PDF
          </a>
          <Link
            href="/clients/new"
            className="-mt-5 flex flex-col items-center justify-center text-[11px] font-semibold text-primary"
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(46,196,182,0.45)]">
              <Plus className="size-6" />
            </span>
            Add
          </Link>
        </div>
      </nav>
      )}
    </div>
  );
}
