"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Calculator, HardHat } from "lucide-react";
import { enterAsAccountant, enterAsEngineer } from "@/lib/role-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

type Step = "choose" | "accountant";
type AccountantState = { error?: string } | undefined;

export function RoleGate({
  children,
  blocking = false,
}: {
  children?: ReactNode;
  blocking?: boolean;
}) {
  const [open, setOpen] = useState(blocking);
  const [step, setStep] = useState<Step>("choose");
  const [state, action] = useActionState(
    async (_prev: AccountantState, formData: FormData) => enterAsAccountant(formData),
    undefined,
  );

  return (
    <Dialog
      open={blocking ? true : open}
      onOpenChange={
        blocking
          ? () => undefined
          : (next) => {
              setOpen(next);
              if (!next) setStep("choose");
            }
      }
    >
      {blocking || !children ? null : <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={!blocking}
        className="gap-5 sm:max-w-md"
        onPointerDownOutside={blocking ? (event) => event.preventDefault() : undefined}
        onInteractOutside={blocking ? (event) => event.preventDefault() : undefined}
        onEscapeKeyDown={blocking ? (event) => event.preventDefault() : undefined}
      >
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Who&apos;s opening Receivables?</DialogTitle>
              <DialogDescription>
                Accountants can add and edit. Engineers can only view.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setStep("accountant")}
                className="flex min-h-20 items-center gap-4 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-border"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Calculator className="size-5" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-base font-semibold">Accountant</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    Add clients, dues, and payments
                  </span>
                </span>
              </button>
              <form action={enterAsEngineer}>
                <button
                  type="submit"
                  className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-border"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0F766E] text-white">
                    <HardHat className="size-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-base font-semibold">Engineer</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      View only — no adding or editing
                    </span>
                  </span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Accountant password</DialogTitle>
              <DialogDescription>Only the office accountant can change the books.</DialogDescription>
            </DialogHeader>
            <form action={action} className="grid gap-4">
              {state?.error ? (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="accountant-password">Password</Label>
                <Input
                  id="accountant-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="h-12"
                />
              </div>
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setStep("choose")}>
                  Back
                </Button>
                <SubmitButton pendingLabel="Opening...">Open receivables</SubmitButton>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
