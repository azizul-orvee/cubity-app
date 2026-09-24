import { notFound } from "next/navigation";
import { getPaymentInstructions } from "@/lib/queries";
import { getInvoice } from "@/lib/invoice-queries";
import { buildInvoicePdf } from "@/lib/pdf";

export const preferredRegion = "sin1";

function invoicePdfFilename(name: string, number: string) {
  const slug = name
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");
  return `${slug || "Client"}-${number}-invoice.pdf`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const pdf = await buildInvoicePdf(invoice, await getPaymentInstructions());
  const filename = invoicePdfFilename(invoice.clientName, invoice.number);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
