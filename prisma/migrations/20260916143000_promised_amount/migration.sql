-- AlterTable
ALTER TABLE "Client" ADD COLUMN "nextPromisedAmount" INTEGER;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN "promisedAmount" INTEGER;
