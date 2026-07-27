-- Migration: add_ramp_transaction
-- Adds provider-agnostic fiat on/off-ramp tables + enums.
-- Hand-authored to match the Prisma schema. In an environment with database
-- write access this is produced by `prisma migrate dev`; this environment
-- denied the shadow-database step (P1010), so the SQL is provided directly.
-- Existing tables (transactions, settlement_instructions, etc.) are UNCHANGED.

-- CreateEnum
CREATE TYPE "RampProvider" AS ENUM ('MONEYGRAM');

-- CreateEnum
CREATE TYPE "RampType" AS ENUM ('ONRAMP', 'OFFRAMP');

-- CreateEnum
CREATE TYPE "RampStatus" AS ENUM (
  'INITIATED',
  'PENDING_USER_TRANSFER',
  'PENDING_ANCHOR',
  'PENDING_STELLAR',
  'PENDING_EXTERNAL',
  'COMPLETED',
  'REFUNDED',
  'EXPIRED',
  'ERROR'
);

-- CreateTable
CREATE TABLE "ramp_transactions" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(40) NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "RampProvider" NOT NULL DEFAULT 'MONEYGRAM',
    "type" "RampType" NOT NULL,
    "status" "RampStatus" NOT NULL DEFAULT 'INITIATED',
    "user_stellar_address" VARCHAR(191) NOT NULL,
    "asset_code" VARCHAR(12) NOT NULL DEFAULT 'USDC',
    "provider_tx_id" VARCHAR(191),
    "interactive_url" TEXT,
    "amount_in" VARCHAR(40),
    "amount_out" VARCHAR(40),
    "amount_fee" VARCHAR(40),
    "reference_number" VARCHAR(120),
    "stellar_memo" VARCHAR(120),
    "stellar_memo_type" VARCHAR(40),
    "anchor_account" VARCHAR(191),
    "stellar_tx_hash" VARCHAR(128),
    "failure_code" VARCHAR(80),
    "failure_message" TEXT,
    "last_polled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ramp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ramp_transaction_events" (
    "id" UUID NOT NULL,
    "ramp_transaction_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "RampStatus",
    "event_type" VARCHAR(80) NOT NULL,
    "source" VARCHAR(40) NOT NULL DEFAULT 'system',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ramp_transaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ramp_transactions_public_id_key" ON "ramp_transactions"("public_id");
CREATE UNIQUE INDEX "ramp_transactions_provider_tx_id_key" ON "ramp_transactions"("provider_tx_id");
CREATE INDEX "ramp_transactions_user_id_created_at_idx" ON "ramp_transactions"("user_id", "created_at");
CREATE INDEX "ramp_transactions_status_created_at_idx" ON "ramp_transactions"("status", "created_at");
CREATE INDEX "ramp_transactions_provider_status_idx" ON "ramp_transactions"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ramp_transaction_events_ramp_transaction_id_sequence_key" ON "ramp_transaction_events"("ramp_transaction_id", "sequence");
CREATE INDEX "ramp_transaction_events_event_type_created_at_idx" ON "ramp_transaction_events"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "ramp_transactions" ADD CONSTRAINT "ramp_transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ramp_transaction_events" ADD CONSTRAINT "ramp_transaction_events_ramp_transaction_id_fkey"
  FOREIGN KEY ("ramp_transaction_id") REFERENCES "ramp_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
