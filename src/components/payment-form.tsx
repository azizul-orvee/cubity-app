"use client";

import { useActionState, useState } from "react";
import { recordPayment } from "@/lib/actions";
import { PAYMENT_METHODS } from "@/lib/company";
import { todayInputValue } from "@/lib/dates";
import { formatMoney, parseAmountToPoisha } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

type State = { error?: string } | undefined;

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

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Current outstanding is {formatMoney(outstanding)}. If they pay part of it, set the next promised date for what is left.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="date">Payment date</Label>
          <Input id="date" name="date" type="date" required defaultValue={todayInputValue()} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount received *</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="5000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Method</Label>
          <input type="hidden" name="method" value={method} />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-full">
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
        <div className="grid gap-2">
          <Label htmlFor="promisedDate">Next promised date</Label>
          <Input id="promisedDate" name="promisedDate" type="date" required={paid > 0 && remaining > 0} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" name="note" placeholder="Partial payment, rest next Saturday..." />
        </div>
      </div>
      <div className="rounded-lg bg-muted px-3 py-2 text-sm">
        Remaining after this payment:{" "}
        <span className="font-medium">
          {remaining > 0 ? formatMoney(remaining) : remaining < 0 ? `${formatMoney(Math.abs(remaining))} credit` : formatMoney(0)}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <a href={`/clients/${clientId}`}>Cancel</a>
        </Button>
        <SubmitButton>Save payment</SubmitButton>
      </div>
    </form>
  );
}
