import { format, isBefore, parseISO, startOfDay } from "date-fns";

export const DHAKA_TZ = "Asia/Dhaka";

export function todayInputValue() {
  return new Date().toLocaleDateString("en-CA", { timeZone: DHAKA_TZ });
}

/** Year and month as four digits, e.g. September 2026 → 2609. */
export function invoiceYearMonthCode(isoDate: string) {
  const [year, month] = isoDate.split("-");
  if (!year || !month) return "";
  return `${year.slice(-2)}${month}`;
}

export function parseDateInput(value: string) {
  if (!value) return null;
  return new Date(`${value}T12:00:00.000Z`);
}

export function toInputValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return parsed.toISOString().slice(0, 10);
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "dd MMM yyyy");
}

export function formatDateLong(date?: Date | string | null) {
  if (!date) return "—";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "EEE, dd MMM yyyy");
}

export function startOfToday() {
  return startOfDay(parseISO(`${todayInputValue()}T00:00:00.000Z`));
}

export function isDateBeforeToday(date?: Date | string | null) {
  if (!date) return false;
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return isBefore(startOfDay(parsed), startOfToday());
}

export function daysFromToday(date?: Date | string | null) {
  if (!date) return 0;
  const parsed = typeof date === "string" ? parseISO(date) : date;
  const diff = startOfDay(parsed).getTime() - startOfToday().getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function addDaysToInput(days: number) {
  const date = parseISO(`${todayInputValue()}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
