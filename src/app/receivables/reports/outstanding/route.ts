import { getClients } from "@/lib/queries";
import { buildOutstandingSummaryPdf } from "@/lib/pdf";

export const preferredRegion = "sin1";

export async function GET() {
  const clients = await getClients();
  const pdf = await buildOutstandingSummaryPdf(clients);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cubity-outstanding-receivables.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
