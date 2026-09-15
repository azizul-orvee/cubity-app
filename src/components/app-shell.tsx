"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FileDown, LayoutDashboard, Menu, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(46,196,182,0.12),_transparent_32%),linear-gradient(180deg,#f7fbfb_0%,#eef6f6_100%)]">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Cubity</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                  <NavLinks pathname={pathname} />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/cubity-logo.jpg"
                alt="Cubity"
                width={40}
                height={40}
                className="size-10 rounded-full ring-1 ring-border"
                priority
              />
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-wide text-foreground">
                  CUBITY
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Receivables
                </span>
              </span>
            </Link>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Button
                key={link.href}
                variant={isActive(pathname, link.href) ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <a href="/reports/outstanding">
                <FileDown className="size-4" />
                Company PDF
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/clients/new">
                <Plus className="size-4" />
                Client
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
