import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add a client</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Name and phone are enough. Email and address if you have them.
        </p>
      </div>
      <Card>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
