import { invoicePayStatus, type InvoicePayStatus } from "@/lib/invoice-queries";

const SEAL: Record<InvoicePayStatus, { word: string; color: string }> = {
  unpaid: { word: "UNPAID", color: "#c4161c" },
  partial: { word: "PARTIAL", color: "#b45309" },
  paid: { word: "PAID", color: "#1b7a3a" },
};

export function PaymentSeal({ paidAmount, total }: { paidAmount: number; total: number }) {
  const status = invoicePayStatus(paidAmount, total);
  const { word, color } = SEAL[status];

  return (
    <div className="relative inline-flex" style={{ color }} role="img" aria-label={word}>
      <svg className="absolute size-0" aria-hidden="true">
        <filter id="cubity-pay-seal">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
        </filter>
      </svg>
      <div
        className="relative rounded-[1.15rem] border-[3px] border-current px-4 py-1.5"
        style={{ filter: "url(#cubity-pay-seal)" }}
      >
        <span className="absolute -top-[0.55rem] right-3 bg-white px-1 text-[9px] leading-none font-bold tracking-[0.16em]">
          CUBITY
        </span>
        <span className="text-[1.65rem] leading-none font-black tracking-[0.08em]">{word}</span>
      </div>
    </div>
  );
}
