import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/payment-form";
import { clientStatus } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getClient } from "@/lib/queries";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const status = clientStatus(client);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log payment from {client.name}</h1>
        <p className="text-sm text-muted-foreground">
          Example: they pay 5,000 today and keep 2,000 as due for another date.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>Outstanding before this payment: {formatMoney(status.outstanding)}</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm clientId={client.id} outstanding={status.outstanding} />
        </CardContent>
      </Card>
    </div>
  );
}
