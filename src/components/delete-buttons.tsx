"use client";

import { deleteClient, voidEntry } from "@/lib/actions";
import { deleteInvoice, deleteInvoicePayment } from "@/lib/invoice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function VoidEntryButton({
  entryId,
  clientId,
}: {
  entryId: string;
  clientId: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="xs">
          Void
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            The line stays on the ledger and on the statement, struck through, and stops counting
            towards the balance. Say why, so the statement explains itself later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={voidEntry.bind(null, entryId, clientId)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`void-reason-${entryId}`}>
              Reason <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`void-reason-${entryId}`}
              name="reason"
              autoComplete="off"
              placeholder="Entered twice, wrong client, wrong amount"
              className="h-12 rounded-xl text-base md:text-base"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Void entry
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteInvoiceButton({ invoiceId, name }: { invoiceId: string; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className="h-12 w-full text-sm font-medium text-destructive">
          Delete invoice
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes {name}&apos;s invoice. The office service list stays as it is, and any
            ledger entries it created stay on the client&apos;s account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deleteInvoice.bind(null, invoiceId)}>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Delete invoice
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteInvoicePaymentButton({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className="shrink-0 text-sm font-medium text-destructive">
          Remove
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this payment?</AlertDialogTitle>
          <AlertDialogDescription>
            This takes the receipt off the invoice. The billed amount stays the same, and the balance due goes up.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deleteInvoicePayment.bind(null, invoiceId, paymentId)}>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Remove payment
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteClientButton({ clientId, name }: { clientId: string; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete client</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the client and their full due / payment history, including
            voided entries. To correct a single line, void it instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deleteClient.bind(null, clientId)}>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Delete client
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
