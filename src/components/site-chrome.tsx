import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { hubPath } from "@/lib/routes";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[radial-gradient(120%_80%_at_0%_-10%,rgba(46,196,182,0.22),transparent_42%),radial-gradient(90%_60%_at_100%_0%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,#f4fbfb_0%,#eef6f6_100%)]">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)]">
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
              <span className="block text-[13px] font-semibold tracking-[0.14em] text-foreground">
                CUBITY
              </span>
              <span className="block text-[11px] text-muted-foreground">Engineering & Construction</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-5 py-8 md:py-12">
        {children}
      </main>

      <footer className="mt-auto border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 text-sm">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            Cubity office
          </p>
          <p className="font-medium">{COMPANY.legalName}</p>
          <p className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {companyAddressLine()}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {COMPANY.phones.map((phone) => (
              <a
                key={phone.tel}
                href={`tel:${phone.tel}`}
                className="inline-flex min-h-11 items-center gap-2 font-medium"
              >
                <Phone className="size-4 text-primary" />
                {phone.display}
              </a>
            ))}
          </div>
          <a href={`mailto:${COMPANY.email}`} className="inline-flex min-h-11 items-center gap-2 font-medium">
            <Mail className="size-4 text-primary" />
            {COMPANY.email}
          </a>
        </div>
      </footer>
    </div>
  );
}
