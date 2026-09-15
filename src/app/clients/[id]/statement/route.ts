import { notFound } from "next/navigation";
import { getClient } from "@/lib/queries";
import { buildClientStatementPdf } from "@/lib/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const pdf = await buildClientStatementPdf(client);
  const safeName = client.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cubity-due-statement-${safeName || "client"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
