import { createHash, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { receivables } from "@/lib/routes";

export type WorkspaceRole = "accountant" | "engineer";

const COOKIE = "cubity_role";
const ACCOUNTANT_PASSWORD = "8knMp88g*&#qE";
const ROLE_SALT = "cubity-workspace-role-v1";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function roleToken(role: WorkspaceRole) {
  const secret = role === "accountant" ? ACCOUNTANT_PASSWORD : "engineer-open";
  return createHash("sha256").update(`${ROLE_SALT}:${role}:${secret}`).digest("hex");
}

function sameHex(raw: string, expectedHex: string) {
  try {
    const actual = Buffer.from(raw, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const getWorkspaceRole = cache(async (): Promise<WorkspaceRole | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  if (sameHex(raw, roleToken("accountant"))) return "accountant";
  if (sameHex(raw, roleToken("engineer"))) return "engineer";
  return null;
});

export async function canEditReceivables() {
  return (await getWorkspaceRole()) === "accountant";
}

export function accountantPasswordMatches(input: string) {
  const actual = sha256(input);
  const expected = sha256(ACCOUNTANT_PASSWORD);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function setWorkspaceRole(role: WorkspaceRole) {
  (await cookies()).set({
    name: COOKIE,
    value: roleToken(role),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function clearWorkspaceRole() {
  (await cookies()).set({
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAccountant() {
  if (!(await canEditReceivables())) {
    return { error: "Only the accountant can change this." };
  }
  return null;
}

export async function redirectUnlessAccountant(fallback = receivables.root) {
  if (!(await canEditReceivables())) {
    redirect(fallback);
  }
}
