"use client";

import { useActionState, useState } from "react";
import { DeleteInvoicePaymentButton } from "@/components/delete-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { recordInvoicePayment } from "@/lib/invoice-actions";
import { formatDate, todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type State = { error?: string } | undefined;

const fieldClass = "h-14 rounded-2xl text-base md:h-14 md:text-base";

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

export function InvoicePayments({
  invoiceId,
  due,
  payments,
}: {
  invoiceId: string;
  due: number;
  payments: { id: string; amount: number; date: Date; note: string | null }[];
}) {
  const bound = recordInvoicePayment.bind(null, invoiceId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);
  const [amount, setAmount] = useState("");
  const rest = String(Math.floor(Math.max(due, 0) / 100));

  return (
    <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
      <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Each receipt stays on this invoice. The PDF lists them with their dates.
      </p>

      {payments.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Nothing recorded yet.</p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center gap-3 rounded-2xl bg-[#F6FAFA] px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                <p className="text-base font-semibold tabular-nums">{formatMoney(payment.amount)}</p>
                {payment.note ? <p className="truncate text-sm text-muted-foreground">{payment.note}</p> : null}
              </div>
              <DeleteInvoicePaymentButton invoiceId={invoiceId} paymentId={payment.id} />
            </li>
          ))}
        </ul>
      )}

      {due <= 0 ? (
        <p className="mt-5 text-sm font-medium text-[#0F766E]">Paid in full.</p>
      ) : (
        <form action={formAction} className="mt-5 grid gap-5 border-t border-border pt-5">
          {state?.error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-2.5">
            <Label htmlFor="payment-amount" className="text-base">
              Amount received
            </Label>
            <Input
              id="payment-amount"
              name="amount"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(digitsOnly(event.target.value))}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setAmount(rest)}
              className="inline-flex min-h-11 w-fit items-center rounded-full bg-white px-5 text-sm font-medium text-muted-foreground ring-1 ring-border"
            >
              The rest ({formatMoney(due)})
            </button>
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="payment-date" className="text-base">
              Payment date
            </Label>
            <Input
              id="payment-date"
              name="date"
              type="date"
              required
              defaultValue={todayInputValue()}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="payment-note" className="text-base">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="payment-note"
              name="note"
              autoComplete="off"
              placeholder="bKash, bank, cash"
              className={fieldClass}
            />
          </div>
          <SubmitButton className="h-14 rounded-2xl text-base md:h-14">Record payment</SubmitButton>
        </form>
      )}
    </section>
  );
}
