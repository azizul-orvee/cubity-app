"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { totals } from "@/lib/ledger";
import { parseAmountToPoisha } from "@/lib/money";
import { DEFAULT_PAYMENT } from "@/lib/company";
import { receivables } from "@/lib/routes";
import { requireAccountant } from "@/lib/workspace-role";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(3, "Phone is required"),
  address: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email"),
  organization: optionalText,
  siteName: optionalText,
  notes: optionalText,
});

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function resolvePromisedAmount(formData: FormData, remaining: number) {
  if (remaining <= 0) return null;
  const raw = formString(formData, "promisedAmount").trim();
  if (!raw) return remaining;
  const amount = parseAmountToPoisha(raw);
  if (amount == null || amount <= 0) return remaining;
  return Math.min(amount, remaining);
}

function revalidateClient(id?: string) {
  revalidatePath(receivables.root);
  revalidatePath(receivables.clients);
  if (id) {
    revalidatePath(receivables.client(id));
    revalidatePath(receivables.clientDue(id));
    revalidatePath(receivables.clientPay(id));
    revalidatePath(receivables.clientEdit(id));
  }
}

export async function createClient(formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const parsed = clientSchema.safeParse({
    name: formString(formData, "name"),
    phone: formString(formData, "phone"),
    address: formString(formData, "address"),
    email: formString(formData, "email"),
    organization: formString(formData, "organization"),
    siteName: formString(formData, "siteName"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the client details." };
  }

  const client = await prisma.client.create({ data: parsed.data });
  revalidateClient(client.id);
  redirect(receivables.client(client.id));
}

export async function updateClient(clientId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const parsed = clientSchema.safeParse({
    name: formString(formData, "name"),
    phone: formString(formData, "phone"),
    address: formString(formData, "address"),
    email: formString(formData, "email"),
    organization: formString(formData, "organization"),
    siteName: formString(formData, "siteName"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the client details." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: parsed.data,
  });
  revalidateClient(clientId);
  redirect(receivables.client(clientId));
}

export async function deleteClient(clientId: string) {
  const denied = await requireAccountant();
  if (denied) return denied;

  await prisma.client.delete({ where: { id: clientId } });
  revalidateClient();
  redirect(receivables.clients);
}

export async function recordSiteVisit(clientId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const billed = parseAmountToPoisha(formString(formData, "billed"));
  const receivedRaw = formString(formData, "received");
  const received = receivedRaw.trim() ? parseAmountToPoisha(receivedRaw) : 0;
  const date = parseDateInput(formString(formData, "date"));
  const promisedDate = parseDateInput(formString(formData, "promisedDate"));
  const method = formString(formData, "method") || null;
  const note = formString(formData, "note").trim() || null;

  if (!billed || billed <= 0) {
    return { error: "Enter the amount that became due." };
  }
  if (received === null) {
    return { error: "Enter a valid amount received." };
  }
  if (received > billed) {
    return { error: "Amount received cannot be more than the billed amount." };
  }
  if (!date) {
    return { error: "Choose the visit or due date." };
  }

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    include: { entries: true },
  });
  if (!existing) {
    return { error: "Client not found." };
  }

  const remainingAfter = totals(existing.entries).outstanding + billed - received;
  if (remainingAfter > 0 && !promisedDate) {
    return { error: "Set the date they promised to pay the remaining amount." };
  }
  const promisedAmount = remainingAfter > 0 ? resolvePromisedAmount(formData, remainingAfter) : null;

  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.create({
      data: {
        clientId,
        type: "DUE",
        amount: billed,
        date,
        note,
        promisedDate: remainingAfter > 0 ? promisedDate : null,
        promisedAmount,
      },
    });

    if (received > 0) {
      await tx.ledgerEntry.create({
        data: {
          clientId,
          type: "PAYMENT",
          amount: received,
          date,
          method,
          note,
          promisedDate: remainingAfter > 0 ? promisedDate : null,
          promisedAmount,
        },
      });
    }

    await tx.client.update({
      where: { id: clientId },
      data: {
        nextPromisedDate: remainingAfter > 0 ? promisedDate : null,
        nextPromisedAmount: promisedAmount,
      },
    });
  });

  revalidateClient(clientId);
  redirect(receivables.client(clientId));
}

export async function recordPayment(clientId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const amount = parseAmountToPoisha(formString(formData, "amount"));
  const date = parseDateInput(formString(formData, "date"));
  const promisedDate = parseDateInput(formString(formData, "promisedDate"));
  const method = formString(formData, "method") || null;
  const note = formString(formData, "note").trim() || null;

  if (!amount || amount <= 0) {
    return { error: "Enter the amount received." };
  }
  if (!date) {
    return { error: "Choose the payment date." };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { entries: true },
  });

  if (!client) {
    return { error: "Client not found." };
  }

  const current = totals(client.entries);
  const remainingAfter = current.totalDue - current.totalPaid - amount;

  if (remainingAfter > 0 && !promisedDate) {
    return { error: "They still have a due. Set the next promised payment date." };
  }
  const promisedAmount = remainingAfter > 0 ? resolvePromisedAmount(formData, remainingAfter) : null;

  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.create({
      data: {
        clientId,
        type: "PAYMENT",
        amount,
        date,
        method,
        note,
        promisedDate: remainingAfter > 0 ? promisedDate : null,
        promisedAmount,
      },
    });

    await tx.client.update({
      where: { id: clientId },
      data: {
        nextPromisedDate: remainingAfter > 0 ? promisedDate : null,
        nextPromisedAmount: promisedAmount,
      },
    });
  });

  revalidateClient(clientId);
  redirect(receivables.client(clientId));
}

export async function updatePromisedDate(clientId: string, formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const promisedDate = parseDateInput(formString(formData, "promisedDate"));
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { entries: true },
  });
  if (!client) return;

  const outstanding = Math.max(totals(client.entries).outstanding, 0);
  const promisedAmount =
    promisedDate && outstanding > 0 ? resolvePromisedAmount(formData, outstanding) : null;

  const latestEntry = [...client.entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  ).at(-1);

  await prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: {
        nextPromisedDate: outstanding > 0 ? promisedDate : null,
        nextPromisedAmount: promisedAmount,
      },
    }),
    ...(latestEntry && outstanding > 0
      ? [
          prisma.ledgerEntry.update({
            where: { id: latestEntry.id },
            data: { promisedDate, promisedAmount },
          }),
        ]
      : []),
  ]);
  revalidateClient(clientId);
}

const paymentSchema = z.object({
  bkashNumber: z.string().trim().min(3, "Enter the bKash number"),
  bankAccountName: z.string().trim().min(1, "Enter the account name"),
  bankAccountNumber: z.string().trim().min(1, "Enter the account number"),
  bankName: z.string().trim().min(1, "Enter the bank name"),
  bankBranch: z.string().trim().min(1, "Enter the branch"),
  bankRoutingNumber: optionalText,
});

export async function updatePaymentInstructions(formData: FormData) {
  const denied = await requireAccountant();
  if (denied) return denied;

  const parsed = paymentSchema.safeParse({
    bkashNumber: formString(formData, "bkashNumber"),
    bankAccountName: formString(formData, "bankAccountName"),
    bankAccountNumber: formString(formData, "bankAccountNumber"),
    bankName: formString(formData, "bankName"),
    bankBranch: formString(formData, "bankBranch"),
    bankRoutingNumber: formString(formData, "bankRoutingNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the payment details." };
  }

  await prisma.companyPayment.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_PAYMENT, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath(receivables.root);
  revalidatePath(receivables.settings);
  return { ok: true };
}

export async function deleteEntry(entryId: string, clientId: string) {
  const denied = await requireAccountant();
  if (denied) return denied;

  await prisma.ledgerEntry.delete({ where: { id: entryId } });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { entries: true },
  });

  if (client) {
    const { outstanding } = {
      outstanding: totals(client.entries).outstanding,
    };
    if (outstanding <= 0) {
      await prisma.client.update({
        where: { id: clientId },
        data: { nextPromisedDate: null, nextPromisedAmount: null },
      });
    }
  }

  revalidateClient(clientId);
}
