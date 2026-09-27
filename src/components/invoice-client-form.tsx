"use client";

import { useActionState, useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { createClientFromInvoice, setInvoiceClient } from "@/lib/invoice-ledger-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

type State = { error?: string } | undefined;

export type ClientOption = {
  id: string;
  name: string;
  phone: string;
  siteName: string | null;
};

export type InvoiceContact = {
  clientName: string;
  clientPhone: string | null;
  clientAddress: string | null;
  projectName: string | null;
};

const fieldClass = "h-14 rounded-2xl text-base md:h-14 md:text-base";

export function InvoiceClientForm({
  invoiceId,
  clients,
  currentClientId,
  contact,
}: {
  invoiceId: string;
  clients: ClientOption[];
  currentClientId: string | null;
  contact: InvoiceContact;
}) {
  // A bill is usually for someone who is not on the ledger yet, so a brand new
  // client is the default when nothing is linked.
  const [mode, setMode] = useState<"new" | "existing">(
    currentClientId ? "existing" : "new",
  );

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F6FAFA] p-1.5">
        <ModeTab on={mode === "new"} onClick={() => setMode("new")} icon={<UserPlus className="size-4" />}>
          New client
        </ModeTab>
        <ModeTab on={mode === "existing"} onClick={() => setMode("existing")} icon={<Users className="size-4" />}>
          Someone on the ledger
        </ModeTab>
      </div>

      {mode === "new" ? (
        <NewClientForm invoiceId={invoiceId} contact={contact} />
      ) : (
        <ExistingClientForm
          invoiceId={invoiceId}
          clients={clients}
          currentClientId={currentClientId}
          suggestedName={contact.clientName}
        />
      )}
    </div>
  );
}

function ModeTab({
  on,
  onClick,
  icon,
  children,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "cb-tap flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-semibold",
        on ? "bg-white text-foreground ring-1 ring-border" : "text-muted-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function NewClientForm({ invoiceId, contact }: { invoiceId: string; contact: InvoiceContact }) {
  const bound = createClientFromInvoice.bind(null, invoiceId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);

  return (
    <form action={formAction} className="grid gap-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Everything is filled in from the invoice. Change anything that needs changing, and they will be
        added to Receivables with this bill linked to them.
      </p>

      {state?.error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-2.5">
        <Label htmlFor="new-client-name" className="text-base">
          Name
        </Label>
        <Input
          id="new-client-name"
          name="name"
          required
          autoCapitalize="words"
          enterKeyHint="next"
          defaultValue={contact.clientName}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="new-client-phone" className="text-base">
          Phone
        </Label>
        <Input
          id="new-client-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          enterKeyHint="next"
          defaultValue={contact.clientPhone ?? ""}
          placeholder="01XXXXXXXXX"
          className={fieldClass}
        />
        <p className="text-sm text-muted-foreground">
          {contact.clientPhone
            ? "From the invoice."
            : "The invoice has no phone number, so add one. Receivables needs it to call or WhatsApp."}
        </p>
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="new-client-address" className="text-base">
          Address <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="new-client-address"
          name="address"
          defaultValue={contact.clientAddress ?? ""}
          placeholder="House, road, area"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="new-client-site" className="text-base">
          Site / project <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="new-client-site"
          name="siteName"
          defaultValue={contact.projectName ?? ""}
          placeholder="e.g. Chowhatta residence"
          className={fieldClass}
        />
      </div>

      <SubmitButton className="h-14 rounded-2xl text-base md:h-14">
        Create the client and link this bill
      </SubmitButton>
    </form>
  );
}

function ExistingClientForm({
  invoiceId,
  clients,
  currentClientId,
  suggestedName,
}: {
  invoiceId: string;
  clients: ClientOption[];
  currentClientId: string | null;
  suggestedName: string;
}) {
  const bound = setInvoiceClient.bind(null, invoiceId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);
  const [picked, setPicked] = useState(currentClientId ?? "");
  const [query, setQuery] = useState("");

  // The invoice already carries a client name, so the likely match goes first.
  const ordered = useMemo(() => {
    const needle = suggestedName.trim().toLowerCase();
    return [...clients].sort((a, b) => {
      const aHit = needle && a.name.toLowerCase().includes(needle) ? 0 : 1;
      const bHit = needle && b.name.toLowerCase().includes(needle) ? 0 : 1;
      return aHit - bHit || a.name.localeCompare(b.name);
    });
  }, [clients, suggestedName]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (client) => client.name.toLowerCase().includes(q) || client.phone.includes(q),
    );
  }, [ordered, query]);

  return (
    <div className="grid gap-5">
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="clientId" value={picked} />
        {state?.error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        {clients.length === 0 ? (
          <p className="rounded-2xl bg-[#F6FAFA] px-4 py-6 text-center text-sm text-muted-foreground">
            No clients on the ledger yet. Use <span className="font-medium">New client</span> above.
          </p>
        ) : (
          <>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or phone"
                enterKeyHint="search"
                className="h-14 rounded-2xl pl-11"
              />
            </div>

            {visible.length === 0 ? (
              <p className="rounded-2xl bg-[#F6FAFA] px-4 py-6 text-center text-sm text-muted-foreground">
                No client matches that search.
              </p>
            ) : (
              <ul className="grid max-h-[24rem] gap-2 overflow-y-auto">
                {visible.map((client) => {
                  const on = picked === client.id;
                  return (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(client.id)}
                        aria-pressed={on}
                        className={cn(
                          "cb-tap flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
                          on ? "bg-white ring-2 ring-primary" : "bg-[#F6FAFA]",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-base leading-snug font-semibold">{client.name}</span>
                          <span className="block text-sm text-muted-foreground">
                            {client.phone}
                            {client.siteName ? ` · ${client.siteName}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <SubmitButton disabled={!picked} className="h-14 rounded-2xl text-base md:h-14">
              {picked && picked === currentClientId ? "Keep this client" : "Link this client"}
            </SubmitButton>
            {picked ? null : (
              <p className="text-sm text-muted-foreground">Pick a client above to link the bill.</p>
            )}
          </>
        )}
      </form>

      {currentClientId ? (
        <form action={formAction} className="border-t border-border pt-5">
          <input type="hidden" name="clientId" value="" />
          <SubmitButton variant="outline" className="h-12 w-full rounded-2xl text-sm">
            Remove the link
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
