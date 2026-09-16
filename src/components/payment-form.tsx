"use client";

import { useActionState, useState } from "react";
import { recordPayment } from "@/lib/actions";
import { PAYMENT_METHODS } from "@/lib/company";
import { todayInputValue } from "@/lib/dates";
import { formatMoney, parseAmountToPoisha } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { receivables } from "@/lib/routes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

const fieldClass = "h-12 text-base md:h-12 md:text-base";

export function PaymentForm({
  clientId,
  outstanding,
}: {
  clientId: string;
  outstanding: number;
}) {
  const bound = recordPayment.bind(null, clientId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  const paid = parseAmountToPoisha(amount) ?? 0;
  const remaining = outstanding - paid;
  const stillDue = paid > 0 && remaining > 0;

  let leftoverLabel = formatMoney(0);
  if (remaining > 0) leftoverLabel = formatMoney(remaining);
  if (remaining < 0) leftoverLabel = `${formatMoney(Math.abs(remaining))} credit`;

  return (
    <form action={formAction} className="grid gap-5">
      {state?.error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="amount" className="text-base">
            Amount received
          </Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            autoComplete="off"
            enterKeyHint="next"
            placeholder="5000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date" className="text-base">
            Payment date
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={todayInputValue()}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-base">Method</Label>
          <input type="hidden" name="method" value={method} />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className={`w-full ${fieldClass}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {stillDue ? (
          <div className="grid gap-2">
            <Label htmlFor="promisedDate" className="text-base">
              Next promised date
            </Label>
            <p className="text-sm text-muted-foreground">
              {formatMoney(remaining)} will still be due. When will they pay the rest?
            </p>
            <Input
              id="promisedDate"
              name="promisedDate"
              type="date"
              required
              className={fieldClass}
            />
            <Label htmlFor="promisedAmount" className="text-base">
              Amount they promised next
            </Label>
            <p className="text-sm text-muted-foreground">
              Leave blank for the full leftover. Use a smaller number if they will only bring part of it.
            </p>
            <Input
              id="promisedAmount"
              name="promisedAmount"
              inputMode="decimal"
              placeholder={(remaining / 100).toString()}
              className={fieldClass}
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl bg-muted px-4 py-3 text-base">
        Remaining after this payment:{" "}
        <span className="font-semibold">{leftoverLabel}</span>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-base sm:w-auto md:h-12"
          asChild
        >
          <a href={receivables.client(clientId)}>Cancel</a>
        </Button>
        <SubmitButton className="h-12 w-full text-base sm:min-w-40 sm:w-auto md:h-12">
          Save payment
        </SubmitButton>
      </div>
    </form>
  );
}
