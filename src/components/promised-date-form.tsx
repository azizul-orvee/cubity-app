"use client";

import { updatePromisedDate } from "@/lib/actions";
import { toInputValue } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PromisedDateForm({
  clientId,
  promisedDate,
}: {
  clientId: string;
  promisedDate?: Date | null;
}) {
  return (
    <form action={updatePromisedDate.bind(null, clientId)} className="grid gap-3">
      <Label htmlFor="promisedDate">Promised pay date</Label>
      <div className="flex gap-2">
        <Input
          id="promisedDate"
          name="promisedDate"
          type="date"
          defaultValue={toInputValue(promisedDate)}
        />
        <Button type="submit" variant="outline">
          Update
        </Button>
      </div>
    </form>
  );
}
