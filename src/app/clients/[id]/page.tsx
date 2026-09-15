import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, MessageCircle, Pencil, Phone, Plus, Wallet } from "lucide-react";
import { DeleteClientButton, DeleteEntryButton } from "@/components/delete-buttons";
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
    <div className="grid gap-5">
      <div>
        <Link href="/clients" className="text-sm font-medium text-primary">
          Clients
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">{client.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {client.phone}
              {client.siteName ? ` · ${client.siteName}` : ""}
            </p>
            <div className="mt-2">
              <DueStatusBadge status={status} />
            </div>
          </div>
          <Link
            href={`/clients/${client.id}/edit`}
            className="grid size-11 place-items-center rounded-full bg-white ring-1 ring-border"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#128C86] via-[#2EC4B6] to-[#7DD3FC] p-5 text-white shadow-[0_16px_32px_rgba(18,140,134,0.25)]">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">Outstanding</p>
        <p className="mt-1 text-4xl font-semibold">{formatMoney(status.outstanding)}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${paidPercent * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-white/85">
          Paid {formatMoney(status.totalPaid)} of {formatMoney(status.totalDue)} billed
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Action href={telHref(client.phone)} icon={<Phone className="size-5" />} label="Call" />
        <Action href={whatsappHref(client.phone, followUp)} icon={<MessageCircle className="size-5" />} label="WhatsApp" external />
        <Action href={`/clients/${client.id}/due`} icon={<Plus className="size-5" />} label="Add due" primary />
        <Action href={`/clients/${client.id}/pay`} icon={<Wallet className="size-5" />} label="Log payment" />
      </div>

      <a
        href={`/clients/${client.id}/statement`}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold ring-1 ring-border"
      >
        <FileDown className="size-4 text-primary" />
        Download due statement
      </a>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <p className="text-xs font-medium text-muted-foreground">Promised pay date</p>
        <p className="mt-1 text-xl font-semibold">
          {status.promised ? formatDate(status.promised) : "Not set"}
        </p>
        {status.outstanding > 0 ? (
          <div className="mt-3">
            <PromisedDateForm clientId={client.id} promisedDate={client.nextPromisedDate} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No remaining due.</p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <h2 className="text-base font-semibold">Ledger</h2>
        <p className="mb-3 text-sm text-muted-foreground">Every due and payment, running balance.</p>
        {ledger.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No dues yet. Log billed amount, paid now, and the promised date for the rest.
          </p>
        ) : (
          <div className="grid gap-2">
            {ledger.map((line) => (
              <article key={line.entry.id} className="rounded-2xl bg-muted/60 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{formatDate(line.entry.date)}</p>
                    <p className="font-medium">
                      {line.entry.type === "DUE" ? "Due added" : "Payment received"}
                      {paymentMethodLabel(line.entry.method) ? ` · ${paymentMethodLabel(line.entry.method)}` : ""}
                    </p>
                    {line.entry.note ? (
                      <p className="text-xs text-muted-foreground">{line.entry.note}</p>
                    ) : null}
                    {line.entry.promisedDate ? (
                      <p className="text-xs text-muted-foreground">
                        Remaining promised {formatDate(line.entry.promisedDate)}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className={line.paid ? "font-semibold text-teal-600" : "font-semibold text-indigo-600"}>
                      {line.due ? `+ ${formatMoney(line.due)}` : `− ${formatMoney(line.paid)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Bal {formatMoney(line.balance)}</p>
                    <DeleteEntryButton entryId={line.entry.id} clientId={client.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {client.address || client.email || client.notes || client.organization ? (
        <section className="rounded-3xl bg-white p-4 text-sm ring-1 ring-border">
          <h2 className="mb-2 text-base font-semibold">Profile</h2>
          {client.organization ? <p>{client.organization}</p> : null}
          {client.address ? <p className="text-muted-foreground">{client.address}</p> : null}
          {client.email ? <p className="text-muted-foreground">{client.email}</p> : null}
          {client.notes ? <p className="mt-2 text-muted-foreground">{client.notes}</p> : null}
        </section>
      ) : null}

      <div className="flex justify-center">
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
    ? "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
    : "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl bg-white text-sm font-semibold ring-1 ring-border";

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
