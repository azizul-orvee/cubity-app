"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  loadInvoiceServices,
  saveInvoiceServices,
  type CatalogService,
} from "@/lib/invoice-catalog";
import { Input } from "@/components/ui/input";

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

export function ServiceEditor() {
  const [services, setServices] = useState<CatalogService[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setServices(loadInvoiceServices());
  }, []);

  function commit(next: CatalogService[]) {
    setServices(next);
    saveInvoiceServices(next);
  }

  if (!services) {
    return (
      <div className="grid gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-black/[0.06]" />
        ))}
      </div>
    );
  }

  function remove(service: CatalogService, index: number) {
    const before = services ?? [];
    commit(before.filter((item) => item.id !== service.id));
    toast(`Removed “${service.name}”`, {
      action: {
        label: "Undo",
        onClick: () => {
          const current = loadInvoiceServices();
          if (current.some((item) => item.id === service.id)) return;
          const restored = [...current];
          restored.splice(Math.min(index, restored.length), 0, service);
          commit(restored);
        },
      },
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <form
        className="grid gap-3 rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]"
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
          toast.success("Service added");
        }}
      >
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Add a service</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
        <Input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError("");
          }}
          placeholder="Service name"
          aria-label="New service name"
          size={1}
          enterKeyHint="done"
          className="h-14 min-w-0 flex-1 rounded-2xl text-base md:h-14 md:text-base"
          onFocus={revealField}
        />
        <button
          type="submit"
          aria-label="Add service"
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"
        >
          <Plus className="size-5" />
        </button>
        </div>
      </form>

      {services.length === 0 ? (
        <p className="rounded-[1.75rem] bg-white px-6 py-8 text-center text-sm text-muted-foreground ring-1 ring-black/[0.06]">
          The list is empty. Add a service above.
        </p>
      ) : (
        <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
          <h2 className="text-lg font-semibold tracking-tight">Your services</h2>
          <p className="mt-1 mb-5 text-sm leading-relaxed text-muted-foreground">
            {services.length} {services.length === 1 ? "service" : "services"} to pick from on an invoice.
          </p>
          <ol className="grid gap-3">
            {services.map((service, index) => (
              <ServiceRow
                key={service.id}
                index={index}
                service={service}
                editing={editingId === service.id}
                onEdit={() => setEditingId(service.id)}
                onCancel={() => setEditingId(null)}
                onSave={(name) => {
                  commit(services.map((item) => (item.id === service.id ? { ...item, name } : item)));
                  setEditingId(null);
                }}
                onRemove={() => remove(service, index)}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function ServiceRow({
  index,
  service,
  editing,
  onEdit,
  onCancel,
  onSave,
  onRemove,
}: {
  index: number;
  service: CatalogService;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (name: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [error, setError] = useState("");

  const number = (
    <span className="w-5 shrink-0 text-sm font-semibold text-primary tabular-nums">{index + 1}</span>
  );

  if (!editing) {
    return (
      <li className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#F6FAFA] py-2 pr-2 pl-4">
        {number}
        <span className="min-w-0 flex-1 text-base leading-snug font-medium">{service.name}</span>
        <button
          type="button"
          onClick={() => {
            setName(service.name);
            onEdit();
          }}
          aria-label={`Rename ${service.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-border"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${service.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-destructive ring-1 ring-border"
        >
          <Trash2 className="size-4" />
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-2xl bg-white py-3 pr-2 pl-4 ring-2 ring-primary">
      <form
        className="flex items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const next = name.trim();
          if (next.length < 2) {
            setError("Enter a service name.");
            return;
          }
          setError("");
          onSave(next);
        }}
      >
        {number}
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          aria-label="Service name"
          size={1}
          enterKeyHint="done"
          className="h-12 min-w-0 flex-1 rounded-xl bg-white px-3 text-base ring-1 ring-border outline-none focus:ring-2 focus:ring-ring/50"
          onFocus={revealField}
        />
        <button
          type="submit"
          aria-label="Save name"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="size-[18px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => {
            setError("");
            onCancel();
          }}
          aria-label="Cancel"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"
        >
          <X className="size-[18px]" />
        </button>
      </form>
      {error ? <p className="mt-2 pl-8 text-sm text-destructive">{error}</p> : null}
    </li>
  );
}
