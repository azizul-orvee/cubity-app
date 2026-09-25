"use client";

import { useActionState, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import type { Invoice, InvoiceLine } from "@prisma/client";
import Link from "next/link";
import { Check } from "lucide-react";
import { saveInvoice } from "@/lib/invoice-actions";
import { loadInvoiceServices, type CatalogService } from "@/lib/invoice-catalog";
import { invoiceDateCode, todayInputValue, toInputValue } from "@/lib/dates";
import { formatMoney, poishaToInput } from "@/lib/money";
import { invoices } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

const fieldClass = "h-14 rounded-2xl text-base md:h-14 md:text-base";

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

function cleanInvoiceId(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function cleanIdPart(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function splitInvoiceId(number: string) {
  const match = number.toUpperCase().match(/^([A-Z0-9]+)-(\d{4})-([A-Z0-9]+)$/);
  if (!match) return null;
  return { prefix: match[1], code: match[2], suffix: match[3] };
}

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

function Section({ title, hint, aside, children }: { title: string; hint?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {hint ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        {aside}
      </div>
      <div className="mt-5 grid gap-6">{children}</div>
    </section>
  );
}

function Optional() {
  return <span className="font-normal text-muted-foreground">(optional)</span>;
}

type InvoiceWithLines = Invoice & { lines: InvoiceLine[] };

/** `invoice` edits that invoice. `template` only pre-fills a new invoice from another one. */
export function InvoiceForm({ invoice, template }: { invoice?: InvoiceWithLines; template?: InvoiceWithLines }) {
  const source = invoice ?? template;
  const [services, setServices] = useState<CatalogService[]>([]);

  const [selected, setSelected] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [paid, setPaid] = useState(invoice ? poishaToInput(invoice.paidAmount) : "");
  const savedParts = invoice ? splitInvoiceId(invoice.number) : null;
  const legacyId = Boolean(invoice && !savedParts);
  const [invoiceId, setInvoiceId] = useState(invoice?.number ?? "");
  const [prefix, setPrefix] = useState(savedParts?.prefix ?? "CC420");
  const [suffix, setSuffix] = useState(savedParts?.suffix ?? "C01");
  const [issueDate, setIssueDate] = useState(invoice ? toInputValue(invoice.issueDate) : todayInputValue());
  const [dateTouched, setDateTouched] = useState(false);
  const todayRef = useRef(todayInputValue());
  const dateCode = !invoice || dateTouched ? invoiceDateCode(issueDate) : (savedParts?.code ?? invoiceDateCode(issueDate));
  const composedId = `${prefix}-${dateCode}-${suffix}`;

  useEffect(() => {
    if (invoice) return;
    const timer = window.setInterval(() => {
      const next = todayInputValue();
      const previous = todayRef.current;
      todayRef.current = next;
      if (next === previous) return;
      setIssueDate((current) => (current === previous ? next : current));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [invoice]);

  useEffect(() => {
    const catalog = loadInvoiceServices();
    const known = new Set(catalog.map((service) => service.name));
    const extras = (source?.lines ?? [])
      .filter((line) => !known.has(line.serviceName))
      .map((line) => ({ id: `line-${line.id}`, name: line.serviceName }));
    const next = [...catalog, ...extras];
    setServices(next);
    if (!source) return;
    const selectedIds: string[] = [];
    const nextAmounts: Record<string, string> = {};
    for (const line of source.lines) {
      const match = next.find((service) => service.name === line.serviceName);
      const key = match?.id ?? line.serviceName;
      selectedIds.push(key);
      nextAmounts[key] = poishaToInput(line.amount);
    }
    setSelected(selectedIds);
    setAmounts(nextAmounts);
  }, [source]);
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
  const overpaid = total > 0 && paidAmount > total;
  const totalTaka = Math.floor(total / 100);

  const paidPresets: { label: string; value: string | null }[] = [
    { label: "Nothing yet", value: "" },
    { label: "Half", value: totalTaka > 0 ? String(Math.floor(totalTaka / 2)) : null },
    { label: "Full amount", value: totalTaka > 0 ? String(totalTaka) : null },
  ];

  function toggle(id: string) {
    setJustSelected(selected.includes(id) ? null : id);
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-5">
      <Section title="Invoice" hint="The invoice ID is printed on the PDF and used as its file name.">
        <div className="grid gap-2.5">
          <Label htmlFor="invoice-prefix" className="text-base">
            Invoice ID
          </Label>
          {legacyId ? (
            <Input
              id="number"
              name="number"
              required
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={40}
              pattern="[A-Z0-9]+(-[A-Z0-9]+)*"
              title="Capital letters, numbers, and hyphens"
              value={invoiceId}
              onChange={(event) => setInvoiceId(cleanInvoiceId(event.target.value))}
              className={cn(fieldClass, "font-semibold tracking-wide")}
              onFocus={revealField}
            />
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Input
                  id="invoice-prefix"
                  required
                  aria-label="Invoice ID start"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  maxLength={16}
                  value={prefix}
                  onChange={(event) => setPrefix(cleanIdPart(event.target.value))}
                  className={cn(fieldClass, "font-semibold tracking-wide")}
                  onFocus={revealField}
                />
                <Input
                  readOnly
                  tabIndex={-1}
                  aria-label="Date and month"
                  value={dateCode}
                  className={cn(fieldClass, "w-[5.5rem] text-center font-semibold tracking-wide text-muted-foreground")}
                />
                <Input
                  required
                  aria-label="Invoice ID end"
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  maxLength={16}
                  value={suffix}
                  onChange={(event) => setSuffix(cleanIdPart(event.target.value))}
                  className={cn(fieldClass, "font-semibold tracking-wide")}
                  onFocus={revealField}
                />
              </div>
              <input type="hidden" name="number" value={composedId} />
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {legacyId
              ? "Capital letters, numbers, and hyphens only."
              : `${composedId}. The middle is the date and month. Change the start and end if you need to.`}
          </p>
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
            value={issueDate}
            onChange={(event) => {
              setDateTouched(true);
              setIssueDate(event.target.value);
            }}
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
      </Section>

      <Section title="Bill to" hint="Who the invoice is for.">
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
            defaultValue={source?.clientName}
            placeholder="Client or company name"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="clientPhone" className="text-base">
            Phone <Optional />
          </Label>
          <Input
            id="clientPhone"
            name="clientPhone"
            type="tel"
            inputMode="tel"
            enterKeyHint="next"
            defaultValue={source?.clientPhone ?? ""}
            placeholder="01XXXXXXXXX"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="projectName" className="text-base">
            Site / project <Optional />
          </Label>
          <Input
            id="projectName"
            name="projectName"
            enterKeyHint="next"
            defaultValue={source?.projectName ?? ""}
            placeholder="e.g. Chowhatta residence"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="clientAddress" className="text-base">
            Address <Optional />
          </Label>
          <Input
            id="clientAddress"
            name="clientAddress"
            defaultValue={source?.clientAddress ?? ""}
            placeholder="House, road, area"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
      </Section>

      <Section
        title="Services"
        hint="Tap a service, then enter its amount."
        aside={
          <Link href={invoices.services} className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary">
            Edit list
          </Link>
        }
      >
        {services.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            No services yet. Add one from the services list, then come back.
          </p>
        ) : (
          <div className="grid gap-3">
            {services.map((service) => {
              const on = selected.includes(service.id);
              const raw = amounts[service.id] ?? "";
              return (
                <div
                  key={service.id}
                  className={cn(
                    "rounded-2xl px-4 py-3 transition-colors",
                    on ? "bg-white ring-2 ring-primary shadow-[0_8px_24px_rgba(18,140,134,0.12)]" : "bg-[#F6FAFA]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(service.id)}
                    aria-pressed={on}
                    className="flex min-h-12 w-full items-center gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full",
                        on ? "bg-primary text-primary-foreground" : "bg-white ring-1 ring-border",
                      )}
                    >
                      {on ? <Check className="size-4" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 text-base leading-snug font-medium">{service.name}</span>
                    {on && raw ? (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#0F766E]">
                        {formatMoney(Number.parseInt(raw, 10) * 100)}
                      </span>
                    ) : null}
                  </button>
                  {on ? (
                    <div className="mt-2 mb-1 grid gap-2 pl-10">
                      <Label htmlFor={`amount-${service.id}`}>Amount (Tk)</Label>
                      <input type="hidden" name="serviceName" value={service.name} />
                      <Input
                        id={`amount-${service.id}`}
                        name="amount"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        required
                        autoFocus={justSelected === service.id}
                        placeholder="0"
                        value={raw}
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
            })}
          </div>
        )}
      </Section>

      <Section title="Payment" hint="How much the client has already paid.">
        <div className="grid gap-2.5">
          <Label htmlFor="paid" className="text-base">
            Paid now <Optional />
          </Label>
          <Input
            id="paid"
            name="paid"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={paid}
            onChange={(event) => setPaid(digitsOnly(event.target.value))}
            aria-invalid={overpaid || undefined}
            className={fieldClass}
            onFocus={revealField}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {paidPresets.map((preset) => {
              const value = preset.value;
              const active = value !== null && paid === value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={value === null}
                  aria-pressed={active}
                  onClick={() => value !== null && setPaid(value)}
                  className={
                    active
                      ? "inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                      : "inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-muted-foreground ring-1 ring-border disabled:opacity-40"
                  }
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <p className={cn("text-sm", overpaid ? "text-destructive" : "text-muted-foreground")}>
            {overpaid ? "Paid amount is higher than the invoice total." : "Leave blank if nothing has been paid yet."}
          </p>
        </div>
      </Section>

      <Section title="Notes">
        <div className="grid gap-2.5">
          <Label htmlFor="notes" className="text-base">
            Note <Optional />
          </Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={source?.notes ?? ""}
            placeholder="Payment terms or a short note"
            className="min-h-28 rounded-2xl text-base"
            onFocus={revealField}
          />
        </div>
      </Section>

      <div className="invoice-dock sticky bottom-0 z-30 -mx-5 mt-3 border-t border-border bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {state?.error ? (
          <p role="alert" className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">Still due</p>
            <p className="text-2xl leading-tight font-semibold tabular-nums tracking-tight text-[#0F766E]">
              {formatMoney(Math.max(due, 0))}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {formatMoney(total)} billed
            </p>
          </div>
          <SubmitButton className="h-14 shrink-0 rounded-2xl px-6 text-base md:h-14">
            {invoice ? "Save invoice" : "Create invoice"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
