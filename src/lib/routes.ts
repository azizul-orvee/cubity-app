export const hubPath = "/";

const RECEIVABLES_CLIENTS = "/receivables/clients";

export const receivables = {
  root: "/receivables",
  clients: RECEIVABLES_CLIENTS,
  clientsNew: `${RECEIVABLES_CLIENTS}/new`,
  settings: "/receivables/settings",
  outstandingPdf: "/receivables/reports/outstanding",
  clientsList(filter?: string, q?: string) {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `${RECEIVABLES_CLIENTS}?${query}` : RECEIVABLES_CLIENTS;
  },
  client(id: string) {
    return `${RECEIVABLES_CLIENTS}/${id}`;
  },
  clientEdit(id: string) {
    return `${RECEIVABLES_CLIENTS}/${id}/edit`;
  },
  clientDue(id: string) {
    return `${RECEIVABLES_CLIENTS}/${id}/due`;
  },
  clientPay(id: string) {
    return `${RECEIVABLES_CLIENTS}/${id}/pay`;
  },
  clientStatement(id: string) {
    return `${RECEIVABLES_CLIENTS}/${id}/statement`;
  },
};

const INVOICES = "/invoices";

export const invoices = {
  root: INVOICES,
  services: `${INVOICES}/services`,
  new: `${INVOICES}/new`,
  invoice(id: string) {
    return `${INVOICES}/${id}`;
  },
  edit(id: string) {
    return `${INVOICES}/${id}/edit`;
  },
  pdf(id: string) {
    return `${INVOICES}/${id}/pdf`;
  },
};

export function isInvoiceFormPath(pathname: string) {
  return pathname === invoices.new || /^\/invoices\/[^/]+\/edit$/.test(pathname);
}

export function isReceivablesFormPath(pathname: string) {
  return (
    pathname === receivables.clientsNew ||
    pathname === receivables.settings ||
    /^\/receivables\/clients\/[^/]+\/(edit|due|pay)$/.test(pathname)
  );
}
