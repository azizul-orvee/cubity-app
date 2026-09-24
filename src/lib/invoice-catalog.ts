export type CatalogService = {
  id: string;
  name: string;
};

const STORAGE_KEY = "cubity-invoice-services";

const DEFAULTS: CatalogService[] = [
  { id: "svc-architectural", name: "Architectural Planning and Drafting" },
  { id: "svc-structural", name: "Structural Design & Drafting" },
  { id: "svc-plumbing", name: "Plumbing and Sanitary Design & Drafting" },
  { id: "svc-electrical", name: "Electrical Design & Drafting" },
  { id: "svc-3d", name: "3D Modeling (Building Exterior)" },
];

export function defaultInvoiceServices() {
  return DEFAULTS.map((service) => ({ ...service }));
}

export function loadInvoiceServices(): CatalogService[] {
  if (typeof window === "undefined") return defaultInvoiceServices();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return defaultInvoiceServices();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultInvoiceServices();
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const id = "id" in item && typeof item.id === "string" ? item.id : "";
      const name = "name" in item && typeof item.name === "string" ? item.name.trim() : "";
      if (!id || !name) return [];
      return [{ id, name }];
    });
  } catch {
    return defaultInvoiceServices();
  }
}

export function saveInvoiceServices(services: CatalogService[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}
