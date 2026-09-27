"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, poishaToInput } from "@/lib/money";

type State = { error?: string } | undefined;

const fieldClass = "h-14 rounded-2xl text-base md:h-14 md:text-base";

function digitsOnly(value: string) {
  const whole = value.replace(/,/g, "").split(".")[0] ?? "";
  return whole.replace(/\D/g, "");
}

export function DiscountForm({
  action,
  billed,
  paid,
  current,
}: {
  action: (formData: FormData) => Promise<State>;
  billed: number;
  paid: number;
  current: number;
}) {
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return action(formData);
  }, undefined);
  const [amount, setAmount] = useState(poishaToInput(current));
  const taka = Number.parseInt(amount, 10);
  const discount = Number.isFinite(taka) ? taka * 100 : 0;
  const tooHigh = discount > billed;
  const net = Math.max(billed - discount, 0);
  const due = net - paid;

  return (
    <div className="grid gap-5">
      <form action={formAction} className="grid gap-5">
        {state?.error ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="grid gap-2.5">
          <Label htmlFor="discount" className="text-base">
            Discount (Tk)
          </Label>
          <Input
            id="discount"
            name="discount"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(digitsOnly(event.target.value))}
            aria-invalid={tooHigh || undefined}
            className={fieldClass}
          />
          <p className={tooHigh ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {tooHigh ? "Discount cannot be more than the billed total." : "Leave blank for no discount."}
          </p>
        </div>
        <dl className="grid gap-2 rounded-2xl bg-[#F6FAFA] px-4 py-4 text-sm">
          <Row label="Billed" value={formatMoney(billed)} />
          <Row label="Discount" value={formatMoney(tooHigh ? 0 : discount)} />
          <Row label="After discount" value={formatMoney(tooHigh ? billed : net)} strong />
          <Row label="Paid" value={formatMoney(paid)} />
          <Row label="Still due" value={formatMoney(Math.max(tooHigh ? billed - paid : due, 0))} strong due />
        </dl>
        <SubmitButton className="h-14 w-full rounded-2xl text-base md:h-14">Save discount</SubmitButton>
      </form>
      {current > 0 ? (
        <form action={formAction}>
          <input type="hidden" name="remove" value="1" />
          <button
            type="submit"
            className="flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-destructive ring-1 ring-border"
          >
            Remove discount
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Row({ label, value, strong, due }: { label: string; value: string; strong?: boolean; due?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={due ? "font-semibold tabular-nums text-[#0F766E]" : "font-semibold tabular-nums"}>{value}</dd>
    </div>
  );
}
