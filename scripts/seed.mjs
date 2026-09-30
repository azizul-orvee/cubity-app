// Fills the LOCAL dev database with made-up clients, dues, payments and invoices.
// Wipes every table first, so it can be re-run any time: `npm run db:seed`.
// Refuses to run against Neon (production).
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (!url || url.includes("neon.tech") || process.env.VERCEL) {
  console.error("Refusing to seed: DATABASE_URL must point at the local cubity_dev database.");
  process.exit(1);
}

const prisma = new PrismaClient();
const tk = (n) => Math.round(n * 100);

// Dates relative to today in Asia/Dhaka, stored at noon UTC like parseDateInput().
function day(offset) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const d = new Date(`${today}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}
const ym = (d) => `${String(d.getUTCFullYear()).slice(-2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

// Each client: profile, ledger rows ([type, tk, dayOffset, extras]), and the next promise.
const clients = [
  {
    name: "Rahim Uddin", phone: "01711000001", siteName: "Duplex, Shibgonj", address: "Shibgonj, Sylhet",
    entries: [["DUE", 45000, -150, { note: "Architectural drawings" }], ["PAYMENT", 15000, -140, { method: "cash" }], ["PAYMENT", 10000, -95, { method: "bkash" }]],
    promise: [-6, 10000], // overdue installment
  },
  {
    name: "Nasrin Akter", phone: "01711000002", siteName: "6-storey residential, Zindabazar", organization: "Akter Properties",
    entries: [["DUE", 120000, -120, { note: "Structural design" }], ["PAYMENT", 40000, -118, { method: "bank" }], ["DUE", 30000, -40, { note: "Revised floor plan" }], ["PAYMENT", 25000, -20, { method: "bank" }]],
    promise: [4, 30000], // upcoming
  },
  {
    name: "Kamal Hossain", phone: "01711000003", siteName: "Shop house, Amberkhana",
    entries: [["DUE", 18000, -75, {}], ["PAYMENT", 18000, -60, { method: "cash" }]],
    promise: null, // settled
  },
  {
    name: "Farhana Begum", phone: "01711000004", siteName: "Villa, Tilagor", email: "farhana@example.com",
    entries: [["DUE", 60000, -35, { note: "Site visit + layout" }], ["PAYMENT", 5000, -35, { method: "cash" }]],
    promise: null, // owes, no date named
  },
  {
    name: "Jamal Ahmed", phone: "01711000005", siteName: "Warehouse, Kadamtali", organization: "Ahmed Traders",
    entries: [["DUE", 250000, -170, { note: "Full design package" }], ["PAYMENT", 50000, -165, { method: "bank" }], ["PAYMENT", 30000, -100, { method: "bank" }]],
    promise: [-45, 50000], // long overdue, 90+ aging
  },
  {
    name: "Shirin Chowdhury", phone: "01711000006", siteName: "Renovation, Uposhohor",
    entries: [["DUE", 22000, -12, {}], ["PAYMENT", 8000, -12, { method: "bkash" }]],
    promise: [1, null], // tomorrow, whole leftover
  },
  {
    name: "Mizanur Rahman", phone: "01711000007", siteName: "Mosque extension, Chowhatta",
    entries: [["DUE", 35000, -50, {}], ["PAYMENT", 40000, -30, { method: "cash", note: "Paid ahead for next phase" }]],
    promise: null, // credit / advance
  },
  {
    name: "Taslima Khatun", phone: "01711000008", siteName: "Apartment interior, Mirboxtula",
    entries: [["DUE", 40000, -65, {}], ["PAYMENT", 10000, -55, { method: "cash" }], ["PAYMENT", 6000, -25, { method: "cash", voided: "Counted twice by mistake" }]],
    discount: 5000,
    promise: [9, 15000],
  },
  {
    name: "Abdul Karim", phone: "01711000009", siteName: "Commercial plaza, Bondor", organization: "Karim Group",
    entries: [["DUE", 180000, -100, { note: "Structural + MEP" }], ["PAYMENT", 60000, -80, { method: "bank" }], ["PAYMENT", 40000, -10, { method: "bank" }]],
    promise: [-2, 40000],
  },
  {
    name: "Sultana Parvin", phone: "01711000010", siteName: "Boundary wall, Khadimnagar",
    entries: [["DUE", 9000, -5, {}]],
    promise: [14, null],
  },
];

const services = [
  ["Architectural design", 30000], ["Structural design", 40000], ["Site visit", 2000],
  ["Soil test coordination", 8000], ["3D elevation", 12000], ["Interior layout", 15000],
  ["MEP drawings", 20000], ["Building permit drawings", 10000],
];

async function main() {
  await prisma.$transaction([
    prisma.clientEvent.deleteMany(), prisma.ledgerEntry.deleteMany(), prisma.invoicePayment.deleteMany(),
    prisma.invoiceLine.deleteMany(), prisma.invoice.deleteMany(), prisma.client.deleteMany(),
    prisma.service.deleteMany(), prisma.companyPayment.deleteMany(),
  ]);

  await prisma.service.createMany({
    data: services.map(([name, amount], i) => ({ name, defaultAmount: tk(amount), sortOrder: i })),
  });

  const byName = {};
  for (const c of clients) {
    const client = await prisma.client.create({
      data: {
        name: c.name, phone: c.phone, siteName: c.siteName, address: c.address ?? "Sylhet",
        email: c.email, organization: c.organization,
        discountAmount: tk(c.discount ?? 0),
        nextPromisedDate: c.promise ? day(c.promise[0]) : null,
        nextPromisedAmount: c.promise?.[1] ? tk(c.promise[1]) : null,
        createdAt: day(c.entries[0][2]),
      },
    });
    byName[c.name] = client;
    for (const [type, amount, offset, x] of c.entries) {
      await prisma.ledgerEntry.create({
        data: {
          clientId: client.id, type, amount: tk(amount), date: day(offset),
          method: x.method, note: x.note,
          voidedAt: x.voided ? day(offset + 1) : null, voidReason: x.voided ?? null,
          createdAt: day(offset),
        },
      });
      if (x.voided) {
        await prisma.clientEvent.create({
          data: { clientId: client.id, kind: "ENTRY_VOIDED", amountBefore: tk(amount), note: x.voided, createdAt: day(offset + 1) },
        });
      }
    }
    if (c.discount) {
      await prisma.clientEvent.create({
        data: { clientId: client.id, kind: "DISCOUNT_SET", amountBefore: 0, amountAfter: tk(c.discount), createdAt: day(-20) },
      });
    }
  }

  // Invoices: [offset, client, phone, project, lines, discount, payments]
  const invoices = [
    [-2, "Rashed Mahmud", "01811000011", "Duplex, Pathantula", [["Architectural design", 30000], ["3D elevation", 12000]], 0, []],
    [-9, "Nusrat Jahan", "01811000012", "Flat interior, Subidbazar", [["Interior layout", 15000], ["Site visit", 2000]], 2000, [[7500, -9]]],
    [-18, "Selim Reza", "01811000013", "Factory shed, Tukerbazar", [["Structural design", 40000], ["Soil test coordination", 8000], ["Building permit drawings", 10000]], 0, [[20000, -18], [38000, -4]]],
    [-33, "Monira Sultana", "01811000014", "Residential, Akhalia", [["Architectural design", 30000], ["Structural design", 40000], ["MEP drawings", 20000]], 5000, [[30000, -30]]],
    [-47, "Hasan Ali", "01811000015", "Shop front, Lamabazar", [["3D elevation", 12000]], 0, [[12000, -45]]],
  ];
  let seq = 1;
  for (const [offset, clientName, clientPhone, projectName, lines, discount, payments] of invoices) {
    const issueDate = day(offset);
    await prisma.invoice.create({
      data: {
        number: `CC420-${ym(issueDate)}-C${String(seq++).padStart(2, "0")}`,
        clientName, clientPhone, clientAddress: "Sylhet", projectName, issueDate,
        discountAmount: tk(discount), createdAt: issueDate,
        lines: { create: lines.map(([serviceName, amount], i) => ({ serviceName, amount: tk(amount), sortOrder: i })) },
        payments: { create: payments.map(([amount, d]) => ({ amount: tk(amount), date: day(d) })) },
      },
    });
  }

  // One bill that is linked to a receivables client and already on their ledger.
  const karim = byName["Abdul Karim"];
  const linkedDate = day(-8);
  const linked = await prisma.invoice.create({
    data: {
      number: `CC420-${ym(linkedDate)}-K01`, clientName: karim.name, clientPhone: karim.phone,
      clientAddress: "Bondor, Sylhet", projectName: "Commercial plaza, Bondor — lift core", issueDate: linkedDate,
      clientId: karim.id, createdAt: linkedDate,
      lines: { create: [{ serviceName: "Structural design", amount: tk(25000), sortOrder: 0 }] },
      payments: { create: [{ amount: tk(10000), date: linkedDate }] },
    },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { clientId: karim.id, invoiceId: linked.id, type: "DUE", amount: tk(25000), date: linkedDate, note: `Invoice ${linked.number}` },
      { clientId: karim.id, invoiceId: linked.id, type: "PAYMENT", amount: tk(10000), date: linkedDate, method: "cash", note: `Invoice ${linked.number}` },
    ],
  });

  console.log(`Seeded ${clients.length} clients, ${invoices.length + 1} invoices, ${services.length} services.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
