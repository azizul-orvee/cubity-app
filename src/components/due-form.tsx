"use client";

import { useActionState, useMemo, useState } from "react";
import { recordSiteVisit } from "@/lib/actions";
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

export function DueForm({
  clientId,
  currentOutstanding = 0,
}: {
  clientId: string;
  currentOutstanding?: number;
}) {
  const bound = recordSiteVisit.bind(null, clientId);
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return bound(formData);
  }, undefined);
  const [billed, setBilled] = useState("");
  const [received, setReceived] = useState("");
  const [method, setMethod] = useState("cash");

  const billedAmount = parseAmountToPoisha(billed) ?? 0;
  const receivedAmount = received.trim() ? parseAmountToPoisha(received) ?? 0 : 0;
  const remainingThisVisit = billedAmount - receivedAmount;
  const remainingTotal = currentOutstanding + remainingThisVisit;

  const helper = useMemo(() => {
    if (!billedAmount) return "Enter what became due today, then how much they paid now.";
    if (remainingThisVisit < 0) return "Amount received is higher than the billed amount.";
    if (remainingTotal <= 0) return "This visit settles the account.";
    return `Remaining after this visit: ${formatMoney(remainingTotal)}. Set the promised date.`;
  }, [billedAmount, remainingThisVisit, remainingTotal]);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{helper}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" required defaultValue={todayInputValue()} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billed">Amount due / billed *</Label>
          <Input
            id="billed"
            name="billed"
            inputMode="decimal"
            required
            placeholder="10000"
            value={billed}
            onChange={(event) => setBilled(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="received">Paid now</Label>
          <Input
            id="received"
            name="received"
            inputMode="decimal"
            placeholder="0"
            value={received}
            onChange={(event) => setReceived(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="promisedDate">Promised date for remaining</Label>
          <Input id="promisedDate" name="promisedDate" type="date" required={billedAmount > 0 && remainingTotal > 0} />
        </div>
        {receivedAmount > 0 ? (
          <div className="grid gap-2">
            <Label>Payment method</Label>
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
        ) : null}
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" name="note" placeholder="Site visit, finishing work, remaining after partial payment..." />
        </div>
      </div>
      <div className="rounded-lg bg-muted px-3 py-2 text-sm">
        Remaining from this visit:{" "}
        <span className="font-medium">{formatMoney(Math.max(remainingThisVisit, 0))}</span>
        {currentOutstanding > 0 ? (
          <>
            {" "}
            · Already outstanding: <span className="font-medium">{formatMoney(currentOutstanding)}</span>
          </>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <a href={`/clients/${clientId}`}>Cancel</a>
        </Button>
        <SubmitButton>Save due</SubmitButton>
      </div>
    </form>
  );
}
