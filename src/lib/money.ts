export function parseAmountToPoisha(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function formatMoney(poisha: number) {
  const taka = poisha / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(taka) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(taka);
  return `Tk ${formatted}`;
}

export function formatMoneyPdf(poisha: number) {
  const taka = poisha / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(taka) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(taka);
  return `Tk ${formatted}`;
}

export function poishaToInput(poisha?: number | null) {
  if (poisha == null || poisha <= 0) return "";
  const taka = poisha / 100;
  return Number.isInteger(taka) ? String(taka) : String(taka);
}

export function formatMoneyCompact(poisha: number) {
  return formatMoney(poisha);
}
