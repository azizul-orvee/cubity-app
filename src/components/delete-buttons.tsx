"use client";

import { deleteClient, deleteEntry } from "@/lib/actions";
import { deleteInvoice } from "@/lib/invoice-actions";
import { Button } from "@/components/ui/button";
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

export function DeleteEntryButton({
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
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the due or payment from the client ledger and updates the outstanding balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deleteEntry.bind(null, entryId, clientId)}>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive">
              Delete entry
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
            This permanently removes {name}&apos;s invoice. The service list on this phone stays as it is.
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
            This permanently removes the client and their full due / payment history.
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
