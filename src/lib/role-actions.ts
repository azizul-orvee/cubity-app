"use server";

import { redirect } from "next/navigation";
import {
  accountantPasswordMatches,
  clearWorkspaceRole,
  setWorkspaceRole,
} from "@/lib/workspace-role";
import { hubPath, receivables } from "@/lib/routes";

export async function enterAsEngineer() {
  await setWorkspaceRole("engineer");
  redirect(receivables.root);
}

export async function enterAsAccountant(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !accountantPasswordMatches(password)) {
    return { error: "Wrong password." };
  }
  await setWorkspaceRole("accountant");
  redirect(receivables.root);
}

export async function logOut() {
  await clearWorkspaceRole();
  redirect(hubPath);
}
