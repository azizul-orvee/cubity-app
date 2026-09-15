import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New client</h1>
        <p className="text-sm text-muted-foreground">Name and phone are required. Add a site if this is a running job.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client profile</CardTitle>
          <CardDescription>You can attach dues and payments after saving.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
