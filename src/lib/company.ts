export const COMPANY = {
  name: "Cubity",
  legalName: "Cubity Engineering & Construction Company",
  tagline: "Receivables",
  addressLine: "Manru Shopping City, Office 243, 1st Floor",
  city: "Chowhatta, Sylhet",
  email: "contact.cubity@gmail.com",
  phones: [
    { display: "01973-914236", tel: "01973914236" },
    { display: "01711-331406", tel: "01711331406" },
    { display: "01782-161432", tel: "01782161432" },
  ],
} as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export function paymentMethodLabel(value?: string | null) {
  if (!value) return null;
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

export function companyPhoneLine() {
  return COMPANY.phones.map((phone) => phone.display).join("  ·  ");
}

export function companyAddressLine() {
  return `${COMPANY.addressLine}, ${COMPANY.city}`;
}
