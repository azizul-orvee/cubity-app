"use client";

import { useState, useTransition, type FocusEvent } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  archiveService,
  createService,
  restoreService,
  updateService,
} from "@/lib/service-actions";
import type { CatalogService } from "@/lib/service-queries";
import { formatMoney, poishaToInput } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

export function ServiceEditor({ services }: { services: CatalogService[] }) {
  const [draft, setDraft] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(formData: FormData) {
    startTransition(async () => {
      const result = await createService(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError("");
      setDraft("");
      setDraftAmount("");
      toast.success("Service added");
    });
  }

  function remove(service: CatalogService) {
    startTransition(async () => {
      const result = await archiveService(service.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast(`Removed “${service.name}”`, {
        action: {
          label: "Undo",
          onClick: () => {
            startTransition(async () => {
              await restoreService(service.id);
            });
          },
        },
      });
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <form action={add} className="grid gap-3 rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Add a service</p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex gap-3">
          <Input
            name="name"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError("");
            }}
            placeholder="Service name"
            aria-label="New service name"
            size={1}
            enterKeyHint="next"
            className="h-14 min-w-0 flex-1 rounded-2xl text-base md:h-14 md:text-base"
            onFocus={revealField}
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Add service"
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-5" />
          </button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-service-amount" className="text-sm">
            Usual amount (Tk) <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="new-service-amount"
            name="defaultAmount"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={draftAmount}
            onChange={(event) => setDraftAmount(digitsOnly(event.target.value))}
            className="h-14 rounded-2xl text-base md:h-14 md:text-base"
            onFocus={revealField}
          />
          <p className="text-sm text-muted-foreground">
            Fills in on a new invoice. You can change it on the invoice.
          </p>
        </div>
      </form>

      {services.length === 0 ? (
        <p className="rounded-[1.75rem] bg-white px-6 py-8 text-center text-sm text-muted-foreground ring-1 ring-black/[0.06]">
          The list is empty. Add a service above.
        </p>
      ) : (
        <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
          <h2 className="text-lg font-semibold tracking-tight">Office services</h2>
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
                onSaved={() => setEditingId(null)}
                onRemove={() => remove(service)}
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
  onSaved,
  onRemove,
}: {
  index: number;
  service: CatalogService;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [amount, setAmount] = useState(poishaToInput(service.defaultAmount));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const number = (
    <span className="w-5 shrink-0 text-sm font-semibold text-primary tabular-nums">{index + 1}</span>
  );

  if (!editing) {
    return (
      <li className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#F6FAFA] py-2 pr-2 pl-4">
        {number}
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-snug font-medium">{service.name}</span>
          {service.defaultAmount ? (
            <span className="block text-sm text-muted-foreground">
              Usually {formatMoney(service.defaultAmount)}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => {
            setName(service.name);
            setAmount(poishaToInput(service.defaultAmount));
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

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateService(service.id, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError("");
      onSaved();
    });
  }

  return (
    <li className="rounded-2xl bg-white py-3 pr-2 pl-4 ring-2 ring-primary">
      <form action={save} className="grid gap-3">
        <div className="flex items-center gap-3">
          {number}
          <input
            name="name"
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
            disabled={pending}
            aria-label="Save name"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
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
        </div>
        <div className="grid gap-2 pl-8">
          <Label htmlFor={`amount-${service.id}`} className="text-sm">
            Usual amount (Tk) <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`amount-${service.id}`}
            name="defaultAmount"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(digitsOnly(event.target.value))}
            className="h-12 rounded-xl text-base md:text-base"
            onFocus={revealField}
          />
        </div>
        {error ? (
          <p role="alert" className="pl-8 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </li>
  );
}
