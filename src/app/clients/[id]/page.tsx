import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, MessageCircle, Pencil, Phone, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const followUp = `Assalamu alaikum ${client.name}, this is Cubity. Your outstanding balance is ${formatMoney(status.outstanding)}.`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground">
              Clients
            </Link>{" "}
            / {client.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.phone}
            {client.organization ? ` · ${client.organization}` : ""}
            {client.siteName ? ` · ${client.siteName}` : ""}
          </p>
          <div className="mt-3">
            <DueStatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={telHref(client.phone)}>
              <Phone className="size-4" />
              Call
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={whatsappHref(client.phone, followUp)} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/clients/${client.id}/statement`}>
              <FileDown className="size-4" />
              Due statement
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(status.outstanding)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {status.credit > 0 ? `Advance / credit ${formatMoney(status.credit)}` : "Amount still to collect"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total billed</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(status.totalDue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Paid so far {formatMoney(status.totalPaid)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Promised date</CardDescription>
            <CardTitle className="text-2xl">
              {status.promised ? formatDate(status.promised) : "Not set"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.outstanding > 0 ? (
              <PromisedDateForm clientId={client.id} promisedDate={client.nextPromisedDate} />
            ) : (
              <p className="text-sm text-muted-foreground">No remaining due.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/clients/${client.id}/due`}>
            <Plus className="size-4" />
            Add due / site visit
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/clients/${client.id}/pay`}>
            <Wallet className="size-4" />
            Log payment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>Every due and payment, with a running balance.</CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dues yet. Log a site visit like: billed 10,000, received 3,000, remaining 7,000 promised Saturday.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((line) => (
                  <TableRow key={line.entry.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(line.entry.date)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">{line.due ? formatMoney(line.due) : "—"}</TableCell>
                    <TableCell className="text-right">{line.paid ? formatMoney(line.paid) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(line.balance)}</TableCell>
                    <TableCell className="text-right">
                      <DeleteEntryButton entryId={line.entry.id} clientId={client.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {client.address || client.email || client.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {client.address ? <p>Address: {client.address}</p> : null}
            {client.email ? <p>Email: {client.email}</p> : null}
            {client.notes ? <p>Notes: {client.notes}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <DeleteClientButton clientId={client.id} name={client.name} />
      </div>
    </div>
  );
}
