import type { Metadata } from "next";
import { PaymentSettingsForm } from "@/components/payment-settings-form";
import { getPaymentInstructions } from "@/lib/queries";
import { redirectUnlessAccountant } from "@/lib/workspace-role";

export const metadata: Metadata = {
  title: "Payment details",
};

export default async function PaymentSettingsPage() {
  await redirectUnlessAccountant();
  const payment = await getPaymentInstructions();

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
          Company
        </p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight">
          Payment details
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          These bKash and bank accounts are printed on every client due statement.
        </p>
      </div>
      <PaymentSettingsForm payment={payment} />
    </div>
  );
}
