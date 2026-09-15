"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { totals } from "@/lib/ledger";
import { parseAmountToPoisha } from "@/lib/money";

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

function revalidateClient(id?: string) {
  revalidatePath("/");
  revalidatePath("/clients");
  if (id) {
    revalidatePath(`/clients/${id}`);
    revalidatePath(`/clients/${id}/due`);
    revalidatePath(`/clients/${id}/pay`);
    revalidatePath(`/clients/${id}/edit`);
  }
}

export async function createClient(formData: FormData) {
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
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
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
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidateClient();
  redirect("/clients");
}

export async function recordSiteVisit(clientId: string, formData: FormData) {
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

  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.create({
      data: {
        clientId,
        type: "DUE",
        amount: billed,
        date,
        note,
        promisedDate: remainingAfter > 0 ? promisedDate : null,
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
        },
      });
    }

    await tx.client.update({
      where: { id: clientId },
      data: {
        nextPromisedDate: remainingAfter > 0 ? promisedDate : null,
      },
    });
  });

  revalidateClient(clientId);
  redirect(`/clients/${clientId}`);
}

export async function recordPayment(clientId: string, formData: FormData) {
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
      },
    });

    await tx.client.update({
      where: { id: clientId },
      data: {
        nextPromisedDate: remainingAfter > 0 ? promisedDate : null,
      },
    });
  });

  revalidateClient(clientId);
  redirect(`/clients/${clientId}`);
}

export async function updatePromisedDate(clientId: string, formData: FormData) {
  const promisedDate = parseDateInput(formString(formData, "promisedDate"));
  await prisma.client.update({
    where: { id: clientId },
    data: { nextPromisedDate: promisedDate },
  });
  revalidateClient(clientId);
}

export async function deleteEntry(entryId: string, clientId: string) {
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
        data: { nextPromisedDate: null },
      });
    }
  }

  revalidateClient(clientId);
}
