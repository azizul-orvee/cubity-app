"use client";

import { useActionState, useState } from "react";
import { addInvoiceToLedger } from "@/lib/invoice-ledger-actions";
import { addDaysToInput, toInputValue, todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

const fieldClass = "h-14 rounded-2xl text-base md:h-14 md:text-base";

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

export function InvoiceLedgerForm({
  invoiceId,
  clientName,
  issueDate,
  net,
  paid,
  clientOutstanding,
}: {
  invoiceId: string;
  clientName: string;
  issueDate: Date;
  net: number;
  paid: number;
  clientOutstanding: number;
}) {
  const bound = addInvoiceToLedger.bind(null, invoiceId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);
  const [promisedAmount, setPromisedAmount] = useState("");

  const remaining = clientOutstanding + net - paid;
  const needsPromise = remaining > 0;

  return (
    <form action={formAction} className="grid gap-6">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <dl className="grid gap-1.5 rounded-2xl bg-[#F6FAFA] px-4 py-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Bill after discount</dt>
          <dd className="font-semibold tabular-nums">{formatMoney(net)}</dd>
        </div>
        {paid > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Already paid on this invoice</dt>
            <dd className="tabular-nums">− {formatMoney(paid)}</dd>
          </div>
        ) : null}
        {clientOutstanding > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{clientName} owes already</dt>
            <dd className="tabular-nums">+ {formatMoney(clientOutstanding)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-border pt-1.5">
          <dt className="font-medium">Outstanding after this</dt>
          <dd className="font-semibold tabular-nums text-[#0F766E]">{formatMoney(Math.max(remaining, 0))}</dd>
        </div>
      </dl>

      <div className="grid gap-2.5">
        <Label htmlFor="ledger-date" className="text-base">
          Due date on the ledger
        </Label>
        <Input
          id="ledger-date"
          name="date"
          type="date"
          required
          defaultValue={toInputValue(issueDate)}
          className={fieldClass}
        />
        <p className="text-sm text-muted-foreground">Defaults to the invoice issue date.</p>
      </div>

      {needsPromise ? (
        <>
          <div className="grid gap-2.5">
            <Label htmlFor="ledger-promised" className="text-base">
              Promised payment date
            </Label>
            <Input
              id="ledger-promised"
              name="promisedDate"
              type="date"
              required
              min={todayInputValue()}
              defaultValue={addDaysToInput(7)}
              className={fieldClass}
            />
            <p className="text-sm text-muted-foreground">
              Required while money is still due, so the bill shows up in the follow-up queue.
            </p>
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="ledger-promised-amount" className="text-base">
              Promised amount <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="ledger-promised-amount"
              name="promisedAmount"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="0"
              value={promisedAmount}
              onChange={(event) => setPromisedAmount(digitsOnly(event.target.value))}
              className={fieldClass}
            />
            <p className="text-sm text-muted-foreground">
              Blank means the whole {formatMoney(Math.max(remaining, 0))}. Enter less for an installment.
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          This bill is fully paid, so no promise is needed. It goes on the ledger as a due and a
          matching payment.
        </p>
      )}

      <SubmitButton className="h-14 rounded-2xl text-base md:h-14">Add to the ledger</SubmitButton>
    </form>
  );
}
