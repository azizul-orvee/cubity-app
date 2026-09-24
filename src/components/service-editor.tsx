"use client";

import { useEffect, useState, type FocusEvent } from "react";
import {
  loadInvoiceServices,
  saveInvoiceServices,
  type CatalogService,
} from "@/lib/invoice-catalog";
import { Input } from "@/components/ui/input";

const fieldClass = "h-14 rounded-2xl text-base";

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

export function ServiceEditor() {
  const [services, setServices] = useState<CatalogService[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setServices(loadInvoiceServices());
  }, []);

  function commit(next: CatalogService[]) {
    setServices(next);
    saveInvoiceServices(next);
  }

  if (!services) {
    return <p className="text-sm text-muted-foreground">Loading services…</p>;
  }

  return (
    <div className="grid gap-4">
      {services.length === 0 ? (
        <p className="rounded-[1.75rem] bg-white p-5 text-sm text-muted-foreground ring-1 ring-black/[0.06]">
          The list is empty. Add a service below.
        </p>
      ) : (
        services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            onSave={(name) =>
              commit(services.map((item) => (item.id === service.id ? { ...item, name } : item)))
            }
            onRemove={() => commit(services.filter((item) => item.id !== service.id))}
          />
        ))
      )}

      <form
        className="grid gap-3 rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (name.length < 2) {
            setError("Enter a service name.");
            return;
          }
          setError("");
          commit([...services, { id: `svc-${Date.now().toString(36)}`, name }]);
          setDraft("");
        }}
      >
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Add a service</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          required
          placeholder="Service name"
          className={fieldClass}
          onFocus={revealField}
        />
        <button
          type="submit"
          className="h-14 rounded-2xl bg-primary text-base font-medium text-primary-foreground"
        >
          Add to the list
        </button>
      </form>
    </div>
  );
}

function ServiceRow({
  service,
  onSave,
  onRemove,
}: {
  service: CatalogService;
  onSave: (name: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [error, setError] = useState("");

  return (
    <form
      className="grid gap-3 rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]"
      onSubmit={(event) => {
        event.preventDefault();
        const next = name.trim();
        if (next.length < 2) {
          setError("Enter a service name.");
          return;
        }
        setError("");
        setName(next);
        onSave(next);
      }}
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        className={fieldClass}
        onFocus={revealField}
      />
      <div className="grid grid-cols-2 gap-3">
        <button type="submit" className="h-12 rounded-2xl bg-secondary text-sm font-medium">
          Save
        </button>
        <button type="button" onClick={onRemove} className="h-12 rounded-2xl text-sm font-medium text-destructive ring-1 ring-border">
          Remove
        </button>
      </div>
    </form>
  );
}
