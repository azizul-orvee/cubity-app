import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { totals } from "@/lib/ledger";
import { getClient } from "@/lib/queries";
import { receivables } from "@/lib/routes";
import { redirectUnlessAccountant } from "@/lib/workspace-role";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await redirectUnlessAccountant(receivables.client(id));
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="cb-stagger mx-auto grid max-w-lg gap-7">
      <div>
        <Link href={receivables.client(client.id)} className="text-sm font-medium text-primary">
          Back to client
        </Link>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">Client account</p>
        <h1 className="mt-2 text-[2rem] leading-none font-semibold tracking-tight">Edit client</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Change the name, phone, site, address, or anything else on this account.
        </p>
      </div>
      <div className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        <ClientForm client={client} billed={totals(client.entries).totalDue} />
      </div>
    </div>
  );
}
