import { revalidatePath, updateTag } from "next/cache";
import { TAGS } from "@/lib/data-cache";
import { invoices, receivables } from "@/lib/routes";

/**
 * Cache invalidation for every write, in one place.
 *
 * `updateTag` only works inside a Server Action, so these are called from the
 * actions in `actions.ts`, `invoice-actions.ts`, `invoice-ledger-actions.ts`,
 * and `service-actions.ts` — never from a route handler or a component.
 */

export function revalidateClient(id?: string) {
  updateTag(TAGS.clients);
  revalidatePath(receivables.root);
  revalidatePath(receivables.clients);
  if (id) {
    revalidatePath(receivables.client(id));
    revalidatePath(receivables.clientDue(id));
    revalidatePath(receivables.clientPay(id));
    revalidatePath(receivables.clientEdit(id));
    revalidatePath(receivables.clientDiscount(id));
  }
}

export function revalidateInvoices(id?: string) {
  updateTag(TAGS.invoices);
  revalidatePath(invoices.root);
  revalidatePath(invoices.services);
  revalidatePath(invoices.new);
  if (id) {
    revalidatePath(invoices.invoice(id));
    revalidatePath(invoices.edit(id));
    revalidatePath(invoices.discount(id));
    revalidatePath(invoices.client(id));
    revalidatePath(invoices.ledger(id));
  }
}

export function revalidateServices() {
  updateTag(TAGS.services);
  revalidatePath(invoices.services);
  revalidatePath(invoices.new);
}
