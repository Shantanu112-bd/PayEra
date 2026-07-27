/**
 * Provider-agnostic fiat on/off-ramp contract.
 *
 * Every ramp provider (MoneyGram, Onramp.money, Transak, Alchemy Pay, ...)
 * implements this interface. The rest of the application depends ONLY on this
 * abstraction + the RampProviderRegistry — never on a concrete provider — so a
 * new provider can be added by (1) implementing this interface and (2)
 * registering it, with no changes to the service, controller, DB, or frontend.
 *
 * The status vocabulary below is intentionally neutral. Each provider is
 * responsible for mapping its native status strings (e.g. MoneyGram/SEP-24
 * `pending_user_transfer_start`, `completed`, ...) onto these values.
 */

export type RampProviderId = 'MONEYGRAM';

/** Neutral lifecycle states, mirrored by the RampStatus Prisma enum. */
export type NormalizedRampStatus =
  | 'INITIATED'
  | 'PENDING_USER_TRANSFER'
  | 'PENDING_ANCHOR'
  | 'PENDING_STELLAR'
  | 'PENDING_EXTERNAL'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'EXPIRED'
  | 'ERROR';

export interface RampAuthContext {
  /** The user's own (non-custodial) Stellar public key. */
  userStellarAddress: string;
}

export interface InitiateRampParams extends RampAuthContext {
  /** Decimal string amount of the asset (e.g. "10.5"). Required for off-ramp. */
  amount?: string | undefined;
  assetCode?: string | undefined;
  /**
   * Optional callback URL the provider MAY POST status changes to, IF the
   * provider supports SEP-24 on_change_callback. Providers that do not
   * document callback support (e.g. MoneyGram) MUST ignore this and the
   * application relies on polling instead. Never assume delivery.
   */
  onChangeCallbackUrl?: string | undefined;
}

export interface InitiateRampResult {
  /** Provider-native transaction id. */
  providerTxId: string;
  /** Interactive (webview) URL to hand to the user. */
  interactiveUrl: string;
  /** Provider's raw initial status, if returned. */
  rawStatus?: string;
}

export interface RampStatusResult {
  status: NormalizedRampStatus;
  /** Provider's raw status string, preserved for the audit trail. */
  rawStatus: string;
  amountIn?: string | undefined;
  amountOut?: string | undefined;
  amountFee?: string | undefined;
  /** Off-ramp cash-pickup reference number. */
  referenceNumber?: string | undefined;
  stellarMemo?: string | undefined;
  stellarMemoType?: string | undefined;
  anchorAccount?: string | undefined;
  stellarTxHash?: string | undefined;
}

/**
 * A single ramp provider adapter. Implementations MUST NOT persist anything
 * or contain orchestration logic — they are pure protocol adapters. The
 * RampsService owns persistence, audit, and retry.
 */
export interface FiatRampProvider {
  /** Stable identifier; must match a RampProvider enum value. */
  readonly id: RampProviderId;

  /** Whether this provider supports on-ramp / off-ramp respectively. */
  supportsOnRamp(): boolean;
  supportsOffRamp(): boolean;

  /**
   * Whether this provider documents server->client status callbacks. If
   * false, the application relies on polling only. (MoneyGram: false.)
   */
  supportsStatusCallback(): boolean;

  /** SEP-10 (or equivalent) auth, returning a provider session token. */
  authenticate(ctx: RampAuthContext): Promise<string>;

  /** Begin an on-ramp (cash-in / deposit). */
  initiateOnRamp(sessionToken: string, params: InitiateRampParams): Promise<InitiateRampResult>;

  /** Begin an off-ramp (cash-out / withdraw). */
  initiateOffRamp(sessionToken: string, params: InitiateRampParams): Promise<InitiateRampResult>;

  /** Single-shot status fetch (no internal polling loop — the poller owns cadence). */
  getStatus(sessionToken: string, providerTxId: string): Promise<RampStatusResult>;
}

/** DI token for the array of registered providers. */
export const RAMP_PROVIDERS = Symbol('RAMP_PROVIDERS');
