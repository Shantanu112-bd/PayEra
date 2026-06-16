-- PostgreSQL hardening constraints that Prisma schema does not model directly.
-- Apply in the first production migration after Prisma creates the base tables.

CREATE UNIQUE INDEX IF NOT EXISTS wallets_one_primary_per_user_idx
  ON wallets (user_id)
  WHERE is_primary = true AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS admin_logs_metadata_gin_idx
  ON admin_logs USING gin (metadata);

CREATE INDEX IF NOT EXISTS outbox_events_payload_gin_idx
  ON outbox_events USING gin (payload);

ALTER TABLE merchant_qr_codes
  ADD CONSTRAINT merchant_qr_codes_default_amount_positive_chk
  CHECK (default_amount_paise IS NULL OR default_amount_paise > 0);

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_amounts_positive_chk
  CHECK (
    threshold_amount_paise > 0
    AND reward_amount_star > 0
    AND budget_star > 0
    AND spent_star >= 0
    AND spent_star <= budget_star
  );

ALTER TABLE transactions
  ADD CONSTRAINT transactions_amounts_positive_chk
  CHECK (
    amount_in_paise > 0
    AND network_fee_paise >= 0
    AND merchant_settlement_paise > 0
    AND merchant_settlement_paise <= amount_in_paise
  );

ALTER TABLE transactions
  ADD CONSTRAINT transactions_crypto_amount_positive_chk
  CHECK (amount_in_crypto IS NULL OR amount_in_crypto > 0);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_usdc_amount_positive_chk
  CHECK (usdc_amount IS NULL OR usdc_amount > 0);

ALTER TABLE settlement_instructions
  ADD CONSTRAINT settlement_instructions_amount_positive_chk
  CHECK (amount_paise > 0);

ALTER TABLE rewards
  ADD CONSTRAINT rewards_star_amount_positive_chk
  CHECK (star_amount > 0);

ALTER TABLE referrals
  ADD CONSTRAINT referrals_reward_amount_positive_chk
  CHECK (reward_amount_star > 0);

ALTER TABLE outbox_events
  ADD CONSTRAINT outbox_events_attempts_non_negative_chk
  CHECK (attempts >= 0);
