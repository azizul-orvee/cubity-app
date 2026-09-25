import { notFound } from "next/navigation";
import { getPaymentInstructions } from "@/lib/queries";
import { getInvoice, invoicePdfFilename, invoiceTotal } from "@/lib/invoice-queries";
import { buildInvoicePdf } from "@/lib/pdf";

export const preferredRegion = "sin1";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const pdf = await buildInvoicePdf(invoice, await getPaymentInstructions());
  const filename = invoicePdfFilename(invoice.number, invoice.paidAmount, invoiceTotal(invoice.lines));

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
