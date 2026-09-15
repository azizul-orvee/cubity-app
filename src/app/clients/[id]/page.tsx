import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, MessageCircle, Pencil, Phone, Plus, Wallet } from "lucide-react";
import { DeleteClientButton, DeleteEntryButton } from "@/components/delete-buttons";
import { PdfDownload } from "@/components/pdf-download";
import { DueStatusBadge } from "@/components/due-status-badge";
import { PromisedDateForm } from "@/components/promised-date-form";
import { formatDate } from "@/lib/dates";
import { clientStatus, runningLedger, telHref, whatsappHref } from "@/lib/ledger";
import { paymentMethodLabel } from "@/lib/company";
import { formatMoney } from "@/lib/money";
import { getClient } from "@/lib/queries";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const status = clientStatus(client);
  const ledger = runningLedger(client.entries);
  const followUp = `Assalamu alaikum ${client.name}, this is Cubity Engineering & Construction. Your outstanding balance is ${formatMoney(status.outstanding)}. — contact.cubity@gmail.com`;
  const paidPercent = status.totalDue > 0 ? Math.min(status.totalPaid / status.totalDue, 1) : 0;

  return (
    <div className="grid gap-8">
      <div>
        <Link href="/clients" className="text-sm font-medium text-primary">
          Clients
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
              Client account
            </p>
            <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">
              {client.name}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {client.phone}
              {client.siteName ? ` · ${client.siteName}` : ""}
            </p>
            <div className="mt-3">
              <DueStatusBadge status={status} />
            </div>
          </div>
          <Link
            href={`/clients/${client.id}/edit`}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white ring-1 ring-border"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0F766E] via-[#128C86] to-[#7DD3FC] px-6 py-7 text-white shadow-[0_18px_40px_rgba(15,118,110,0.22)]">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
          Outstanding
        </p>
        <p className="mt-3 text-[2.35rem] leading-none font-semibold tracking-tight">
          {formatMoney(status.outstanding)}
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${paidPercent * 100}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/85">
          Paid {formatMoney(status.totalPaid)} of {formatMoney(status.totalDue)} billed
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Action href={telHref(client.phone)} icon={<Phone className="size-5" />} label="Call" />
        <Action href={whatsappHref(client.phone, followUp)} icon={<MessageCircle className="size-5" />} label="WhatsApp" external />
        <Action href={`/clients/${client.id}/due`} icon={<Plus className="size-5" />} label="Add due" primary />
        <Action href={`/clients/${client.id}/pay`} icon={<Wallet className="size-5" />} label="Log payment" />
      </div>

      <PdfDownload
        href={`/clients/${client.id}/statement`}
        title="Download due statement?"
        description={`This saves ${client.name}'s ledger as a PDF on this device.`}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold ring-1 ring-border"
      >
        <FileDown className="size-4 text-primary" />
        Download due statement
      </PdfDownload>

      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Promised pay date
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">
          {status.promised ? formatDate(status.promised) : "Not set"}
        </p>
        {status.outstanding > 0 ? (
          <div className="mt-5">
            <PromisedDateForm clientId={client.id} promisedDate={client.nextPromisedDate} />
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">No remaining due.</p>
        )}
      </section>

      <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <h2 className="text-lg font-semibold tracking-tight">Ledger</h2>
        <p className="mt-1 mb-5 text-sm leading-relaxed text-muted-foreground">
          Every due and payment, with a running balance.
        </p>
        {ledger.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            No dues yet. Log billed amount, paid now, and the promised date for the rest.
          </p>
        ) : (
          <div className="grid gap-3">
            {ledger.map((line) => (
              <article key={line.entry.id} className="rounded-2xl bg-[#F6FAFA] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{formatDate(line.entry.date)}</p>
                    <p className="mt-1 font-medium">
                      {line.entry.type === "DUE" ? "Due added" : "Payment received"}
                      {paymentMethodLabel(line.entry.method) ? ` · ${paymentMethodLabel(line.entry.method)}` : ""}
                    </p>
                    {line.entry.note ? (
                      <p className="mt-1 text-sm text-muted-foreground">{line.entry.note}</p>
                    ) : null}
                    {line.entry.promisedDate ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Remaining promised {formatDate(line.entry.promisedDate)}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={line.paid ? "font-semibold tabular-nums text-teal-700" : "font-semibold tabular-nums text-indigo-700"}>
                      {line.due ? `+ ${formatMoney(line.due)}` : `− ${formatMoney(line.paid)}`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Bal {formatMoney(line.balance)}</p>
                    <DeleteEntryButton entryId={line.entry.id} clientId={client.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {client.address || client.email || client.notes || client.organization ? (
        <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
          <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
          <dl className="mt-5 grid gap-5 text-sm">
            {client.organization ? (
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Company
                </dt>
                <dd className="mt-1.5 text-base">{client.organization}</dd>
              </div>
            ) : null}
            {client.address ? (
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Address
                </dt>
                <dd className="mt-1.5 text-base leading-relaxed text-muted-foreground">{client.address}</dd>
              </div>
            ) : null}
            {client.email ? (
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Email
                </dt>
                <dd className="mt-1.5 text-base text-muted-foreground">{client.email}</dd>
              </div>
            ) : null}
            {client.notes ? (
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Notes
                </dt>
                <dd className="mt-1.5 text-base leading-relaxed text-muted-foreground">{client.notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="flex justify-center pt-2 pb-4">
        <DeleteClientButton clientId={client.id} name={client.name} />
      </div>
    </div>
  );
}

function Action({
  href,
  icon,
  label,
  primary,
  external,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  primary?: boolean;
  external?: boolean;
}) {
  const className = primary
    ? "flex min-h-[5rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] bg-primary text-sm font-semibold text-primary-foreground"
    : "flex min-h-[5rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] bg-white text-sm font-semibold ring-1 ring-border";

  if (href.startsWith("/") && !external) {
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      {icon}
      {label}
    </a>
  );
}
