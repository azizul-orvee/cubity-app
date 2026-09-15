import { COMPANY, companyAddressLine, companyPhoneLine } from "@/lib/company";
import { Mail, MapPin, Phone } from "lucide-react";

export function CompanyStamp({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-2xl bg-white/80 p-4 ring-1 ring-border">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">Cubity office</p>
      <p className="mt-1 text-sm font-medium">{COMPANY.legalName}</p>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        {companyAddressLine()}
      </p>
      {!compact ? (
        <>
          <div className="mt-3 grid gap-1.5">
            {COMPANY.phones.map((phone) => (
              <a
                key={phone.tel}
                href={`tel:${phone.tel}`}
                className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-foreground"
              >
                <Phone className="size-4 text-primary" />
                {phone.display}
              </a>
            ))}
          </div>
          <a
            href={`mailto:${COMPANY.email}`}
            className="mt-1 flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium"
          >
            <Mail className="size-4 text-primary" />
            {COMPANY.email}
          </a>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{companyPhoneLine()}</p>
      )}
    </section>
  );
}
