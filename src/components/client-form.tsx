"use client";

import { useActionState, type FocusEvent } from "react";
import type { Client } from "@prisma/client";
import { createClient, updateClient } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

const fieldClass = "h-14 text-base md:h-14 md:text-base";

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

export function ClientForm({ client }: { client?: Client }) {
  const isNew = !client;
  const bound = client ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);

  return (
    <form action={formAction} className="grid gap-7 pb-8" autoComplete="on">
      {state?.error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-6">
        <div className="grid gap-2.5">
          <Label htmlFor="name" className="text-base">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            defaultValue={client?.name}
            placeholder="e.g. Tarek Ahmed"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="phone" className="text-base">
            Phone
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            enterKeyHint="next"
            defaultValue={client?.phone}
            placeholder="01XXXXXXXXX"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="email" className="text-base">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            defaultValue={client?.email ?? ""}
            placeholder="name@email.com"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="address" className="text-base">
            Address <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="address"
            name="address"
            autoComplete="street-address"
            enterKeyHint={isNew ? "done" : "next"}
            defaultValue={client?.address ?? ""}
            placeholder="House, road, area"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>

        {client ? (
          <>
            <div className="grid gap-2.5">
              <Label htmlFor="organization">Company / organization</Label>
              <Input
                id="organization"
                name="organization"
                defaultValue={client.organization ?? ""}
                placeholder="Optional"
                className={fieldClass}
                onFocus={revealField}
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="siteName">Current site / project</Label>
              <Input
                id="siteName"
                name="siteName"
                defaultValue={client.siteName ?? ""}
                placeholder="Optional"
                className={fieldClass}
                onFocus={revealField}
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client.notes ?? ""}
                placeholder="Anything useful to remember"
                className="min-h-28 text-base"
                onFocus={revealField}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-14 w-full text-base sm:w-auto md:h-14"
          asChild
        >
          <a href={client ? `/clients/${client.id}` : "/clients"}>Cancel</a>
        </Button>
        <SubmitButton className="h-14 w-full text-base sm:min-w-40 sm:w-auto md:h-14">
          {client ? "Save client" : "Create client"}
        </SubmitButton>
      </div>
    </form>
  );
}
