"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import type { Invoice, InvoiceLine } from "@prisma/client";
import { saveInvoice } from "@/lib/invoice-actions";
import { loadInvoiceServices, type CatalogService } from "@/lib/invoice-catalog";
import { todayInputValue, toInputValue } from "@/lib/dates";
import { formatMoney, poishaToInput } from "@/lib/money";
import { invoices } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Check } from "lucide-react";
import Link from "next/link";

type State = { error?: string } | undefined;

const fieldClass = "h-14 rounded-2xl text-base";

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

export function InvoiceForm({ invoice }: { invoice?: Invoice & { lines: InvoiceLine[] } }) {
  const [services, setServices] = useState<CatalogService[]>([]);

  const [selected, setSelected] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState(invoice ? poishaToInput(invoice.paidAmount) : "");

  useEffect(() => {
    const catalog = loadInvoiceServices();
    const known = new Set(catalog.map((service) => service.name));
    const extras = (invoice?.lines ?? [])
      .filter((line) => !known.has(line.serviceName))
      .map((line) => ({ id: `line-${line.id}`, name: line.serviceName }));
    const next = [...catalog, ...extras];
    setServices(next);
    if (!invoice) return;
    const selectedIds: string[] = [];
    const nextAmounts: Record<string, string> = {};
    for (const line of invoice.lines) {
      const match = next.find((service) => service.name === line.serviceName);
      const key = match?.id ?? line.serviceName;
      selectedIds.push(key);
      nextAmounts[key] = poishaToInput(line.amount);
    }
    setSelected(selectedIds);
    setAmounts(nextAmounts);
  }, [invoice]);
  const bound = saveInvoice.bind(null, invoice?.id ?? null);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);

  const total = selected.reduce((sum, id) => {
    const taka = Number.parseInt(amounts[id] ?? "", 10);
    return sum + (Number.isFinite(taka) ? taka * 100 : 0);
  }, 0);
  const paidTaka = Number.parseInt(paid, 10);
  const paidAmount = Number.isFinite(paidTaka) ? paidTaka * 100 : 0;
  const due = total - paidAmount;

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={formAction} className="grid gap-6 pb-8">
      {state?.error ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>
      ) : null}

      <section className="grid gap-5 rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]">
        <div className="grid gap-2.5">
          <Label htmlFor="clientName" className="text-base">
            Client
          </Label>
          <Input
            id="clientName"
            name="clientName"
            required
            autoCapitalize="words"
            enterKeyHint="next"
            defaultValue={invoice?.clientName}
            placeholder="Client or company name"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="clientPhone" className="text-base">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="clientPhone"
            name="clientPhone"
            type="tel"
            inputMode="tel"
            defaultValue={invoice?.clientPhone ?? ""}
            placeholder="01XXXXXXXXX"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="projectName" className="text-base">
            Site / project <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="projectName"
            name="projectName"
            defaultValue={invoice?.projectName ?? ""}
            placeholder="e.g. Chowhatta residence"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="clientAddress" className="text-base">
            Address <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="clientAddress"
            name="clientAddress"
            defaultValue={invoice?.clientAddress ?? ""}
            placeholder="Billing address"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="issueDate" className="text-base">
            Issue date
          </Label>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            required
            defaultValue={invoice ? toInputValue(invoice.issueDate) : todayInputValue()}
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Services</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">What are you billing?</h2>
          </div>
          <Link href={invoices.services} className="min-h-11 text-sm font-medium text-primary">
            Edit list
          </Link>
        </div>
        {services.length === 0 ? (
          <p className="rounded-[1.75rem] bg-white p-5 text-sm text-muted-foreground ring-1 ring-black/[0.06]">
            No services yet. Add one from the services list, then come back.
          </p>
        ) : (
          services.map((service) => {
            const on = selected.includes(service.id);
            return (
              <div
                key={service.id}
                className={
                  on
                    ? "rounded-[1.5rem] bg-white p-4 ring-2 ring-primary shadow-[0_8px_24px_rgba(18,140,134,0.12)]"
                    : "rounded-[1.5rem] bg-white p-4 ring-1 ring-black/[0.06]"
                }
              >
                <button
                  type="button"
                  onClick={() => toggle(service.id)}
                  className="flex min-h-12 w-full items-center gap-3 text-left"
                >
                  <span
                    className={
                      on
                        ? "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                        : "grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-border"
                    }
                  >
                    {on ? <Check className="size-4" /> : null}
                  </span>
                  <span className="text-base leading-snug font-medium">{service.name}</span>
                </button>
                {on ? (
                  <div className="mt-3 grid gap-2 pl-10">
                    <Label htmlFor={`amount-${service.id}`}>Amount (Tk)</Label>
                    <input type="hidden" name="serviceName" value={service.name} />
                    <Input
                      id={`amount-${service.id}`}
                      name="amount"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      required
                      placeholder="0"
                      value={amounts[service.id] ?? ""}
                      onChange={(event) =>
                        setAmounts((current) => ({ ...current, [service.id]: digitsOnly(event.target.value) }))
                      }
                      className={fieldClass}
                      onFocus={revealField}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <section className="grid gap-2.5 rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]">
        <Label htmlFor="paid" className="text-base">
          Paid now <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <p className="text-sm text-muted-foreground">Leave blank if nothing has been paid yet.</p>
        <Input
          id="paid"
          name="paid"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="0"
          value={paid}
          onChange={(event) => setPaid(digitsOnly(event.target.value))}
          className={fieldClass}
          onFocus={revealField}
        />
      </section>

      <section className="grid gap-2.5 rounded-[1.75rem] bg-white p-5 ring-1 ring-black/[0.06]">
        <Label htmlFor="notes" className="text-base">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={invoice?.notes ?? ""}
          placeholder="Payment terms or a short note"
          className="min-h-24 rounded-2xl text-base"
          onFocus={revealField}
        />
      </section>

      <div className="rounded-[1.75rem] bg-[#128C86] p-5 text-white shadow-[0_16px_40px_rgba(18,140,134,0.28)]">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">Due</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{formatMoney(Math.max(due, 0))}</p>
        <p className="mt-2 text-sm text-white/80">
          Billed {formatMoney(total)} · Paid {formatMoney(paidAmount)}
        </p>
      </div>

      <SubmitButton className="h-14 w-full rounded-2xl text-base">
        {invoice ? "Save invoice" : "Create invoice"}
      </SubmitButton>
      {invoice ? (
        <Button variant="outline" className="h-14 rounded-2xl" asChild>
          <Link href={invoices.invoice(invoice.id)}>Cancel</Link>
        </Button>
      ) : null}
    </form>
  );
}
