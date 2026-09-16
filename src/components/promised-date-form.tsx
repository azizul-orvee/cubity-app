"use client";

import { updatePromisedDate } from "@/lib/actions";
import { toInputValue } from "@/lib/dates";
import { formatMoney, poishaToInput } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PromisedDateForm({
  clientId,
  promisedDate,
  promisedAmount,
  outstanding,
}: {
  clientId: string;
  promisedDate?: Date | null;
  promisedAmount?: number | null;
  outstanding: number;
}) {
  return (
    <form action={updatePromisedDate.bind(null, clientId)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="promisedDate">Promised pay date</Label>
        <Input
          id="promisedDate"
          name="promisedDate"
          type="date"
          defaultValue={toInputValue(promisedDate)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="promisedAmount">Amount they promised next</Label>
        <p className="text-sm text-muted-foreground">
          Outstanding is {formatMoney(outstanding)}. They can promise only part of it.
        </p>
        <Input
          id="promisedAmount"
          name="promisedAmount"
          inputMode="decimal"
          defaultValue={poishaToInput(promisedAmount)}
          placeholder={(outstanding / 100).toString()}
        />
      </div>
      <Button type="submit" variant="outline" className="justify-self-start">
        Update promise
      </Button>
    </form>
  );
}
