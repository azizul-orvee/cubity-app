"use client";

import { useActionState } from "react";
import type { Client } from "@prisma/client";
import { createClient, updateClient } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

export function ClientForm({ client }: { client?: Client }) {
  const bound = client ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required defaultValue={client?.name} placeholder="e.g. Karim Rahman" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" required defaultValue={client?.phone} placeholder="01XXXXXXXXX" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="organization">Company / organization</Label>
          <Input id="organization" name="organization" defaultValue={client?.organization ?? ""} placeholder="Optional" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} placeholder="Optional" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={client?.address ?? ""} placeholder="Site or billing address" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="siteName">Current site / project</Label>
          <Input id="siteName" name="siteName" defaultValue={client?.siteName ?? ""} placeholder="e.g. Gulshan apartment finishing" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} placeholder="Anything useful to remember about this client" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <a href={client ? `/clients/${client.id}` : "/clients"}>Cancel</a>
        </Button>
        <SubmitButton>{client ? "Save client" : "Create client"}</SubmitButton>
      </div>
    </form>
  );
}
