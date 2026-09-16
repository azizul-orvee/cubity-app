import { notFound } from "next/navigation";
import { getClient, getPaymentInstructions } from "@/lib/queries";
import { buildClientStatementPdf } from "@/lib/pdf";

function clientPdfFilename(name: string) {
  const slug = name
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");
  return `${slug || "Client"}.pdf`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const pdf = await buildClientStatementPdf(client, await getPaymentInstructions());
  const filename = clientPdfFilename(client.name);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
