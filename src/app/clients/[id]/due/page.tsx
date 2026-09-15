import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DueForm } from "@/components/due-form";
import { clientStatus } from "@/lib/ledger";
import { formatMoney } from "@/lib/money";
import { getClient } from "@/lib/queries";

export default async function AddDuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const status = clientStatus(client);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add due for {client.name}</h1>
        <p className="text-sm text-muted-foreground">
          Example: billed 10,000, paid 3,000 now, remaining 7,000 promised for Saturday.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Site visit / new due</CardTitle>
          <CardDescription>
            Current outstanding is {formatMoney(status.outstanding)}. The remaining promised date applies to what is still unpaid after this visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DueForm clientId={client.id} currentOutstanding={status.outstanding} />
        </CardContent>
      </Card>
    </div>
  );
}
