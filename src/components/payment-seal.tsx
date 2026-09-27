import Image from "next/image";
import { invoicePayStatus, type InvoicePayStatus } from "@/lib/invoice-queries";

const SEAL: Record<InvoicePayStatus, { src: string; alt: string; width: number; height: number; className: string }> = {
  unpaid: {
    src: "/seals/unpaid.png",
    alt: "Unpaid",
    width: 365,
    height: 133,
    className: "h-auto w-[9.5rem] max-w-full",
  },
  partial: {
    src: "/seals/partial.png",
    alt: "Partial payment",
    width: 592,
    height: 117,
    className: "h-auto w-56 max-w-full",
  },
  paid: {
    src: "/seals/paid.png",
    alt: "Paid",
    width: 312,
    height: 303,
    className: "h-auto w-24 max-w-full sm:w-28",
  },
};

export function PaymentSeal({ paidAmount, total }: { paidAmount: number; total: number }) {
  const seal = SEAL[invoicePayStatus(paidAmount, total)];

  return (
    <Image
      src={seal.src}
      alt={seal.alt}
      width={seal.width}
      height={seal.height}
      className={seal.className}
      style={{ height: "auto" }}
    />
  );
}
