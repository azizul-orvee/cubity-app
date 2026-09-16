import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto grid max-w-lg gap-7">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
          New account
        </p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Add a client</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
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
