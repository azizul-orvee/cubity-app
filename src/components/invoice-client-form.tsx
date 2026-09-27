"use client";

import { useActionState, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { setInvoiceClient } from "@/lib/invoice-ledger-actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

type State = { error?: string } | undefined;

export type ClientOption = {
  id: string;
  name: string;
  phone: string;
  siteName: string | null;
};

export function InvoiceClientForm({
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
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="clientId" value={picked} />
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

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
          No client matches. Add them in Receivables first.
        </p>
      ) : (
        <ul className="grid max-h-[26rem] gap-2 overflow-y-auto">
          {visible.map((client) => {
            const on = picked === client.id;
            return (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => setPicked(on ? "" : client.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
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

      <SubmitButton className="h-14 rounded-2xl text-base md:h-14">
        {picked ? "Link this client" : "Save without a client"}
      </SubmitButton>
    </form>
  );
}
