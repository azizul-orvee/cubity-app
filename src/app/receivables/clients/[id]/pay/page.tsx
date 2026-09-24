import { Card, CardContent } from "@/components/ui/card";
import { PaymentForm } from "@/components/payment-form";
import { clientStatus } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getClient } from "@/lib/queries";
import { notFound } from "next/navigation";
import { receivables } from "@/lib/routes";
import { redirectUnlessAccountant } from "@/lib/workspace-role";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await redirectUnlessAccountant(receivables.client(id));
  const client = await getClient(id);
  if (!client) notFound();
  const status = clientStatus(client);

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log payment</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {client.name} · they owe {formatMoney(status.outstanding)} now.
        </p>
      </div>
      <Card>
        <CardContent>
          <PaymentForm clientId={client.id} outstanding={status.outstanding} />
        </CardContent>
      </Card>
    </div>
  );
}
