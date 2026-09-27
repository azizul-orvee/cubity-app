-- Four changes, in the order they have to run:
--   1. Invoice.paidAmount becomes derived from InvoicePayment rows, so the column goes away.
--   2. An invoice can point at a receivables client, and a ledger entry can point back at its invoice.
--   3. The service catalog moves off the phone into the database.
--   4. Ledger entries are voided instead of deleted, and discount changes are logged.

-- 1. DERIVE THE PAID TOTAL ---------------------------------------------------
-- Before the column is dropped, make sure every Taka it recorded exists as a
-- receipt row. This covers invoices with no receipts at all and any invoice
-- whose stored total drifted above the sum of its receipts. Receipts are the
-- record from here on, so a stored total *below* the receipts is left alone.
INSERT INTO "InvoicePayment" ("id", "invoiceId", "amount", "date", "note", "createdAt")
SELECT
    'pay_legacy_' || i."id",
    i."id",
    i."paidAmount" - COALESCE(s."total", 0),
    i."issueDate",
    'Recorded before payment history',
    CURRENT_TIMESTAMP
FROM "Invoice" i
LEFT JOIN (
    SELECT "invoiceId", SUM("amount") AS "total"
    FROM "InvoicePayment"
    GROUP BY "invoiceId"
) s ON s."invoiceId" = i."id"
WHERE i."paidAmount" - COALESCE(s."total", 0) > 0;

ALTER TABLE "Invoice" DROP COLUMN "paidAmount";

-- 2. INVOICE <-> CLIENT AND INVOICE <-> LEDGER ------------------------------
ALTER TABLE "Invoice" ADD COLUMN "clientId" TEXT;
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD COLUMN "invoiceId" TEXT;
CREATE INDEX "LedgerEntry_invoiceId_idx" ON "LedgerEntry"("invoiceId");
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. SERVICE CATALOG --------------------------------------------------------
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultAmount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
CREATE INDEX "Service_archivedAt_idx" ON "Service"("archivedAt");

-- The five design services the office already used on paper.
INSERT INTO "Service" ("id", "name", "sortOrder", "createdAt", "updatedAt") VALUES
    ('svc_architectural', 'Architectural Planning and Drafting', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('svc_structural',    'Structural Design & Drafting', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('svc_plumbing',      'Plumbing and Sanitary Design & Drafting', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('svc_electrical',    'Electrical Design & Drafting', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('svc_3d',            '3D Modeling (Building Exterior)', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Any service name already used on an invoice but not in the list above joins
-- the catalog, so nothing the office typed before is lost.
INSERT INTO "Service" ("id", "name", "sortOrder", "createdAt", "updatedAt")
SELECT
    'svc_import_' || MD5(l."serviceName"),
    l."serviceName",
    100,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "serviceName" FROM "InvoiceLine") l
WHERE NOT EXISTS (SELECT 1 FROM "Service" s WHERE s."name" = l."serviceName");

-- 4. APPEND-ONLY LEDGER -----------------------------------------------------
ALTER TABLE "LedgerEntry" ADD COLUMN "voidedAt" TIMESTAMP(3);
ALTER TABLE "LedgerEntry" ADD COLUMN "voidReason" TEXT;

CREATE TABLE "ClientEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountBefore" INTEGER,
    "amountAfter" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientEvent_clientId_idx" ON "ClientEvent"("clientId");

ALTER TABLE "ClientEvent" ADD CONSTRAINT "ClientEvent_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
