import Image from "next/image";
import { format } from "date-fns";
import { Mail, MapPin, Phone } from "lucide-react";
import { COMPANY, companyAddressLine, companyPhoneLine, type PaymentInstructions } from "@/lib/company";
import type { InvoicePdfData } from "@/lib/pdf";
import { formatMoney } from "@/lib/money";
import { PaymentSeal } from "@/components/payment-seal";

/** The invoice on screen, laid out like the downloaded PDF. */
export function InvoicePaper({ invoice, payment }: { invoice: InvoicePdfData; payment: PaymentInstructions }) {
  const total = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const due = total - invoice.paidAmount;
  const showBkash = Boolean(payment.bkashNumber.trim());
  const showBank = Boolean(payment.bankAccountNumber.trim() && payment.bankName.trim());

  return (
    <article className="overflow-hidden rounded-sm bg-white text-[#12171c] shadow-[0_12px_40px_rgba(15,40,40,0.14)] ring-1 ring-black/[0.06]">
      <div className="h-1.5 bg-[#248585]" />
      <div className="px-5 pt-6 pb-5 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Image src="/cubity-logo.jpg" alt="Cubity" width={56} height={56} className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 text-right">
            <p className="text-[13px] leading-tight font-bold text-[#248585] sm:text-[15px]">
              CUBITY ENGINEERING &amp;
              <br />
              CONSTRUCTION COMPANY
            </p>
            <p className="mt-1.5 text-[11px] font-bold tracking-[0.12em]">INVOICE</p>
            <p className="mt-0.5 text-[11px] text-[#475257]">
              Invoice ID: {invoice.number} · Issued {format(invoice.issueDate, "dd MMMM yyyy")}
            </p>
          </div>
        </header>
        <div className="mt-4 border-t-2 border-[#248585]" />
        <div className="mt-px border-t border-[#c7d6d6]" />

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_15rem]">
          <div className="min-w-0">
            <p className="text-[10px] text-[#475257]">BILLED TO</p>
            <p className="mt-1 text-base leading-snug font-bold break-words">{invoice.clientName}</p>
            <div className="mt-1 grid gap-0.5 text-[12px] leading-snug text-[#475257]">
              {invoice.clientPhone ? <p>{invoice.clientPhone}</p> : null}
              {invoice.clientAddress ? <p>{invoice.clientAddress}</p> : null}
              {invoice.projectName ? <p>Site / project: {invoice.projectName}</p> : null}
            </div>
          </div>
          <div className="border-l-[3px] border-[#248585] bg-[#f5fafa] px-4 py-3">
            <p className="text-[10px] font-bold tracking-[0.1em] text-[#475257]">AMOUNT DUE</p>
            <p className="mt-1 text-2xl font-bold text-[#ad1a24] tabular-nums">{formatMoney(due)}</p>
            <div className="mt-2 grid gap-1 border-t border-[#c7d6d6] pt-2 text-[12px]">
              <p className="flex justify-between gap-3">
                <span className="text-[#475257]">Billed</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-[#475257]">Paid</span>
                <span className="tabular-nums">{formatMoney(invoice.paidAmount)}</span>
              </p>
            </div>
          </div>
        </div>

        <table className="mt-6 w-full text-[12px]">
          <thead>
            <tr className="bg-[#144d4f] text-white">
              <th className="px-3 py-2 text-left font-bold">Particulars</th>
              <th className="px-3 py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={`${line.serviceName}-${index}`} className={index % 2 === 0 ? "bg-[#f5fafa]" : undefined}>
                <td className="px-3 py-2.5 align-top leading-snug">{line.serviceName}</td>
                <td className="px-3 py-2.5 text-right align-top whitespace-nowrap tabular-nums">{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#c7d6d6] pt-4">
          <PaymentSeal paidAmount={invoice.paidAmount} total={total} />
          <dl className="grid max-w-60 gap-1.5 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#475257]">Billed</dt>
              <dd className="tabular-nums">{formatMoney(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#475257]">Paid</dt>
              <dd className="tabular-nums">{formatMoney(invoice.paidAmount)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[#475257]">Total due</dt>
              <dd className="text-base font-bold text-[#ad1a24] tabular-nums">{formatMoney(due)}</dd>
            </div>
          </dl>
        </div>

        {invoice.notes ? (
          <div className="mt-6">
            <p className="text-[10px] font-bold tracking-[0.1em] text-[#475257]">NOTES</p>
            <p className="mt-1 text-[12px] leading-relaxed whitespace-pre-line text-[#475257]">{invoice.notes}</p>
          </div>
        ) : null}

        {showBkash || showBank ? (
          <div className="mt-6">
            <p className="text-[10px] font-bold tracking-[0.1em] text-[#475257]">PAYMENT INSTRUCTIONS</p>
            <p className="mt-1 text-[11px] text-[#475257]">
              Kindly remit the outstanding balance to either of the following accounts.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {showBkash ? (
                <PayCard accent="#e2136e" logo="/bkash-mark.png" kicker="BKASH" title="Personal wallet">
                  <p className="text-[15px] font-bold">{payment.bkashNumber}</p>
                </PayCard>
              ) : null}
              {showBank ? (
                <PayCard accent="#0b4f38" logo="/nrb-mark.png" kicker="BANK TRANSFER" title={payment.bankName}>
                  <p className="text-[12px] font-bold">{payment.bankAccountName}</p>
                  <p className="text-[12px] font-bold">A/C {payment.bankAccountNumber}</p>
                  <p className="text-[11px] text-[#475257]">{payment.bankBranch}</p>
                  {payment.bankRoutingNumber ? (
                    <p className="text-[10px] text-[#475257]">Routing {payment.bankRoutingNumber}</p>
                  ) : null}
                </PayCard>
              ) : null}
            </div>
          </div>
        ) : null}

        <footer className="mt-7 grid justify-center gap-1.5 border-t border-[#c7d6d6] pt-4 text-[11px] text-[#293338]">
          <p className="flex items-start gap-2">
            <MapPin className="mt-px size-3.5 shrink-0 text-[#248585]" />
            {companyAddressLine()}
          </p>
          <p className="flex items-start gap-2">
            <Phone className="mt-px size-3.5 shrink-0 text-[#248585]" />
            {companyPhoneLine()}
          </p>
          <p className="flex items-start gap-2">
            <Mail className="mt-px size-3.5 shrink-0 text-[#248585]" />
            {COMPANY.email}
          </p>
        </footer>
      </div>
    </article>
  );
}

function PayCard({
  accent,
  logo,
  kicker,
  title,
  children,
}: {
  accent: string;
  logo: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-l-[3px] border-[#c7d6d6] bg-[#f5fafa] px-3.5 py-3" style={{ borderLeftColor: accent }}>
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-7 w-auto max-w-14 object-contain" />
        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[0.08em] text-[#475257]">{kicker}</p>
          <p className="truncate text-[12px] font-bold">{title}</p>
        </div>
      </div>
      <div className="mt-2 grid gap-0.5 border-t border-[#c7d6d6] pt-2">{children}</div>
    </div>
  );
}
