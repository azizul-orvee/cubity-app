"use client";

import { useActionState, type FocusEvent } from "react";
import Image from "next/image";
import { updatePaymentInstructions } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { PaymentInstructions } from "@/lib/company";
import { receivables } from "@/lib/routes";

type State = { error?: string; ok?: boolean } | undefined;

const fieldClass = "h-14 text-base md:h-14 md:text-base";

function revealField(event: FocusEvent<HTMLElement>) {
  window.setTimeout(() => {
    event.target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

export function PaymentSettingsForm({ payment }: { payment: PaymentInstructions }) {
  const [state, formAction] = useActionState(async (_prev: State, formData: FormData) => {
    return updatePaymentInstructions(formData);
  }, undefined);

  return (
    <form action={formAction} className="grid gap-8 pb-8" autoComplete="on">
      {state?.error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          Saved. New due statements will use these details.
        </p>
      ) : null}

      <section className="grid gap-5 rounded-[1.75rem] bg-white p-6 ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-3">
          <Image
            src="/bkash-mark.png"
            alt="bKash"
            width={96}
            height={48}
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              bKash
            </p>
            <p className="text-sm text-muted-foreground">Personal wallet number printed on statements.</p>
          </div>
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bkashNumber" className="text-base">
            bKash number
          </Label>
          <Input
            id="bkashNumber"
            name="bkashNumber"
            type="tel"
            inputMode="tel"
            required
            defaultValue={payment.bkashNumber}
            placeholder="01XXX XXXXXX"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-[1.75rem] bg-white p-6 ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-3">
          <Image
            src="/nrb-mark.png"
            alt="NRB Bank"
            width={48}
            height={48}
            className="size-10 object-contain"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              Bank account
            </p>
            <p className="text-sm text-muted-foreground">Transfer details printed beside bKash.</p>
          </div>
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankAccountName" className="text-base">
            Account name
          </Label>
          <Input
            id="bankAccountName"
            name="bankAccountName"
            required
            autoCapitalize="characters"
            defaultValue={payment.bankAccountName}
            placeholder="Account holder"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankAccountNumber" className="text-base">
            Account number
          </Label>
          <Input
            id="bankAccountNumber"
            name="bankAccountNumber"
            required
            inputMode="numeric"
            defaultValue={payment.bankAccountNumber}
            placeholder="Account number"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankName" className="text-base">
            Bank name
          </Label>
          <Input
            id="bankName"
            name="bankName"
            required
            defaultValue={payment.bankName}
            placeholder="Bank name"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankBranch" className="text-base">
            Branch
          </Label>
          <Input
            id="bankBranch"
            name="bankBranch"
            required
            defaultValue={payment.bankBranch}
            placeholder="Branch"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="bankRoutingNumber" className="text-base">
            Routing number <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="bankRoutingNumber"
            name="bankRoutingNumber"
            inputMode="numeric"
            defaultValue={payment.bankRoutingNumber ?? ""}
            placeholder="Routing number"
            className={fieldClass}
            onFocus={revealField}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-14 w-full text-base sm:w-auto md:h-14"
          asChild
        >
          <a href={receivables.root}>Cancel</a>
        </Button>
        <SubmitButton className="h-14 w-full text-base sm:min-w-40 sm:w-auto md:h-14">
          Save payment details
        </SubmitButton>
      </div>
    </form>
  );
}
