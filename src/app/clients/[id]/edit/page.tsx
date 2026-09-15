import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/client-form";
import { getClient } from "@/lib/queries";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {client.name}</h1>
        <p className="text-sm text-muted-foreground">Name and phone stay required.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client profile</CardTitle>
          <CardDescription>Changes apply immediately to statements and the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm client={client} />
        </CardContent>
      </Card>
    </div>
  );
}
