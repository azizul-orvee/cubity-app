import { Badge } from "@/components/ui/badge";

export type InvoiceStatus = "paid" | "partial" | "unpaid";

export function invoiceStatus(billed: number, paid: number): InvoiceStatus {
  if (billed > 0 && paid >= billed) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  partial: "Partly paid",
  unpaid: "Unpaid",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paid") return <Badge variant="secondary">Paid</Badge>;
  if (status === "partial") return <Badge>Partly paid</Badge>;
  return <Badge variant="outline">Unpaid</Badge>;
}

const AVATAR = ["#0F766E", "#128C86", "#2563EB", "#7C3AED", "#B45309", "#BE123C"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function InvoiceAvatar({ name, index }: { name: string; index: number }) {
  return (
    <span
      aria-hidden
      className="grid size-14 shrink-0 place-items-center rounded-full text-sm font-semibold tracking-wide text-white"
      style={{ backgroundColor: AVATAR[index % AVATAR.length] }}
    >
      {initials(name)}
    </span>
  );
}
