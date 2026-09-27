/**
 * The service catalog used to live in this browser's localStorage. It now lives
 * in the database (`src/lib/service-queries.ts`), and this file only reads the
 * leftover list so a phone that renamed or added services can move them across
 * once. Nothing writes here any more.
 */

const STORAGE_KEY = "cubity-invoice-services";

/**
 * The raw stored string, which is stable between calls. `useSyncExternalStore`
 * needs a snapshot it can compare, so parsing happens separately.
 */
export function readPhoneServiceRaw() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parsePhoneServiceNames(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const name = "name" in item && typeof item.name === "string" ? item.name.trim() : "";
      return name ? [name] : [];
    });
  } catch {
    return [];
  }
}

export function forgetPhoneServices() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A phone with site data blocked has nothing to forget.
  }
}
