-- CreateTable
CREATE TABLE "CompanyPayment" (
    "id" TEXT NOT NULL,
    "bkashNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankRoutingNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPayment_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CompanyPayment" (
    "id",
    "bkashNumber",
    "bankName",
    "bankBranch",
    "bankAccountName",
    "bankAccountNumber",
    "bankRoutingNumber",
    "updatedAt"
) VALUES (
    'default',
    '01973 914236',
    'NRB Bank',
    'Sylhet Main Branch',
    'MD TAREK AHMED',
    '7087010002828',
    '290913794',
    CURRENT_TIMESTAMP
);
