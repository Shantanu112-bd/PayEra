import { Injectable, Logger } from '@nestjs/common';
import { Networks, Keypair, Transaction } from '@stellar/stellar-sdk';
import {
  FiatRampProvider,
  InitiateRampParams,
  InitiateRampResult,
  NormalizedRampStatus,
  RampAuthContext,
  RampStatusResult,
} from './fiat-ramp-provider.interface';

export class Sep10AuthError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly responseBody?: string) {
    super(message);
    this.name = 'Sep10AuthError';
  }
}

export class Sep24AnchorError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly responseBody?: string) {
    super(message);
    this.name = 'Sep24AnchorError';
  }
}

/**
 * MoneyGram Ramps adapter (SEP-10 auth + SEP-24 interactive deposit/withdraw).
 *
 * Implemented strictly against official docs:
 *  - Stellar SEP-10:  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
 *  - Stellar SEP-24:  https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md
 *  - MoneyGram Ramps: https://developers.stellar.org/docs/tools/ramps/moneygram
 *                     https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
 *
 * OFFICIAL LIMITATIONS encoded here (not worked around, not faked):
 *  - MoneyGram documents STATUS POLLING ONLY (`pending_user_transfer_start` ->
 *    ... -> `completed`). It does NOT document server->client webhooks, so
 *    supportsStatusCallback() returns false and the app polls via getStatus().
 *  - MoneyGram off-ramp pays out as CASH PICKUP at an agent (reference number),
 *    NOT bank/UPI. Merchant UPI settlement is a SEPARATE rail (Decentro).
 *  - Live sandbox round-trips require a MoneyGram-registered/certified anchor
 *    account (KYB + legal). Without it the anchor endpoints reject requests.
 *
 * This class is a PURE adapter: no DB writes, no orchestration, no polling loop.
 */
@Injectable()
export class MoneyGramProvider implements FiatRampProvider {
  readonly id = 'MONEYGRAM' as const;
  private readonly logger = new Logger(MoneyGramProvider.name);

  private readonly homeDomain = process.env.MONEYGRAM_HOME_DOMAIN || 'extmgxanchor.moneygram.com';
  private readonly appHomeDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';

  // Config-driven network (fixes the previously hardcoded TESTNET).
  private get networkPassphrase(): string {
    const network = process.env.STELLAR_NETWORK || 'testnet';
    return network === 'public' ? Networks.PUBLIC : Networks.TESTNET;
  }

  private get platformKeypair(): Keypair {
    const secretKey = process.env.PLATFORM_STELLAR_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        'PLATFORM_STELLAR_SECRET_KEY is not set. Required for SEP-10 authentication and signing challenge transactions.',
      );
    }
    try {
      return Keypair.fromSecret(secretKey);
    } catch (e) {
      throw new Error(
        `PLATFORM_STELLAR_SECRET_KEY is malformed: ${e instanceof Error ? e.message : 'invalid format'}. Must be a valid Stellar secret key starting with "S".`,
      );
    }
  }

  supportsOnRamp(): boolean {
    return true;
  }

  supportsOffRamp(): boolean {
    return true;
  }

  supportsStatusCallback(): boolean {
    // MoneyGram official docs do not document webhook/callback support.
    return false;
  }

  /** Fetch and parse MoneyGram's stellar.toml for SEP endpoints. */
  private async getToml(): Promise<{ transferServerUrl: string; webAuthEndpoint: string }> {
    const tomlUrl = `https://${this.homeDomain}/.well-known/stellar.toml`;
    const response = await fetch(tomlUrl);
    if (!response.ok) {
      throw new Sep24AnchorError(
        `Failed to fetch stellar.toml from ${tomlUrl}`,
        response.status,
        await response.text().catch(() => ''),
      );
    }
    const tomlText = await response.text();
    const transferMatch = tomlText.match(/TRANSFER_SERVER_SEP0024\s*=\s*"([^"]+)"/);
    const authMatch = tomlText.match(/WEB_AUTH_ENDPOINT\s*=\s*"([^"]+)"/);
    if (!transferMatch?.[1] || !authMatch?.[1]) {
      throw new Sep24AnchorError(
        'MoneyGram stellar.toml missing TRANSFER_SERVER_SEP0024 or WEB_AUTH_ENDPOINT',
        response.status,
        tomlText.slice(0, 500),
      );
    }
    return { transferServerUrl: transferMatch[1], webAuthEndpoint: authMatch[1] };
  }

  /** SEP-10: obtain challenge, sign with platform key, exchange for JWT. */
  async authenticate(ctx: RampAuthContext): Promise<string> {
    const { webAuthEndpoint } = await this.getToml();

    const challengeUrl = new URL(webAuthEndpoint);
    challengeUrl.searchParams.set('account', ctx.userStellarAddress);
    challengeUrl.searchParams.set('home_domain', this.appHomeDomain);

    const challengeRes = await fetch(challengeUrl.toString());
    if (!challengeRes.ok) {
      throw new Sep10AuthError('SEP-10 challenge request failed', challengeRes.status, await challengeRes.text().catch(() => ''));
    }

    const challengeData = (await challengeRes.json()) as {
      transaction: string;
      network_passphrase?: string;
    };

    // Guard: verify the challenge is for the network we expect.
    if (challengeData.network_passphrase && challengeData.network_passphrase !== this.networkPassphrase) {
      throw new Sep10AuthError(
        `SEP-10 network mismatch: challenge is for "${challengeData.network_passphrase}", expected "${this.networkPassphrase}"`,
      );
    }

    const tx = new Transaction(challengeData.transaction, this.networkPassphrase);
    tx.sign(this.platformKeypair);

    const tokenRes = await fetch(webAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: tx.toXDR() }),
    });
    if (!tokenRes.ok) {
      throw new Sep10AuthError('SEP-10 authentication failed', tokenRes.status, await tokenRes.text().catch(() => ''));
    }

    const tokenData = (await tokenRes.json()) as { token: string };
    if (!tokenData.token) {
      throw new Sep10AuthError('SEP-10 response missing token');
    }
    this.logger.log(`SEP-10 authenticated ${ctx.userStellarAddress.substring(0, 8)}…`);
    return tokenData.token;
  }

  async initiateOnRamp(sessionToken: string, params: InitiateRampParams): Promise<InitiateRampResult> {
    return this.initiateInteractive('deposit', sessionToken, params);
  }

  async initiateOffRamp(sessionToken: string, params: InitiateRampParams): Promise<InitiateRampResult> {
    if (!params.amount) {
      throw new Sep24AnchorError('Off-ramp (withdraw) requires an amount');
    }
    return this.initiateInteractive('withdraw', sessionToken, params);
  }

  private async initiateInteractive(
    kind: 'deposit' | 'withdraw',
    sessionToken: string,
    params: InitiateRampParams,
  ): Promise<InitiateRampResult> {
    const { transferServerUrl } = await this.getToml();

    const body = new URLSearchParams({
      asset_code: params.assetCode || 'USDC',
      account: params.userStellarAddress,
      lang: 'en',
    });
    if (params.amount) body.append('amount', params.amount);
    // SEP-24 on_change_callback is only sent if a URL is provided AND the
    // provider supports it. MoneyGram does not document support, so callers
    // should not pass one; we forward it only when present for spec-compliant
    // anchors, and never rely on it.
    if (params.onChangeCallbackUrl && this.supportsStatusCallback()) {
      body.append('on_change_callback', params.onChangeCallbackUrl);
    }

    const response = await fetch(`${transferServerUrl}/transactions/${kind}/interactive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!response.ok) {
      throw new Sep24AnchorError(
        `SEP-24 ${kind} initiation failed`,
        response.status,
        await response.text().catch(() => ''),
      );
    }

    const data = (await response.json()) as { type: string; url: string; id: string };
    this.logger.log(`SEP-24 ${kind} initiated: ${data.id}`);
    return { providerTxId: data.id, interactiveUrl: data.url };
  }

  async getStatus(sessionToken: string, providerTxId: string): Promise<RampStatusResult> {
    const { transferServerUrl } = await this.getToml();
    const response = await fetch(`${transferServerUrl}/transaction?id=${encodeURIComponent(providerTxId)}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!response.ok) {
      throw new Sep24AnchorError('SEP-24 status check failed', response.status, await response.text().catch(() => ''));
    }

    const { transaction } = (await response.json()) as {
      transaction: {
        status: string;
        amount_in?: string;
        amount_out?: string;
        amount_fee?: string;
        withdraw_memo?: string;
        withdraw_memo_type?: string;
        withdraw_anchor_account?: string;
        stellar_transaction_id?: string;
        external_transaction_id?: string;
      };
    };

    return {
      status: this.mapStatus(transaction.status),
      rawStatus: transaction.status,
      amountIn: transaction.amount_in,
      amountOut: transaction.amount_out,
      amountFee: transaction.amount_fee,
      // For off-ramp cash pickup MoneyGram surfaces the reference via the
      // external_transaction_id field.
      referenceNumber: transaction.external_transaction_id,
      stellarMemo: transaction.withdraw_memo,
      stellarMemoType: transaction.withdraw_memo_type,
      anchorAccount: transaction.withdraw_anchor_account,
      stellarTxHash: transaction.stellar_transaction_id,
    };
  }

  /**
   * Map SEP-24 native status strings to the app's neutral vocabulary.
   * Ref: SEP-24 "Transaction Statuses".
   */
  private mapStatus(raw: string): NormalizedRampStatus {
    switch (raw) {
      case 'incomplete':
      case 'pending_user_transfer_start':
        return 'PENDING_USER_TRANSFER';
      case 'pending_anchor':
      case 'pending_trust':
      case 'pending_user':
        return 'PENDING_ANCHOR';
      case 'pending_stellar':
        return 'PENDING_STELLAR';
      case 'pending_user_transfer_complete':
      case 'pending_external':
        return 'PENDING_EXTERNAL';
      case 'completed':
        return 'COMPLETED';
      case 'refunded':
        return 'REFUNDED';
      case 'expired':
      case 'too_late':
        return 'EXPIRED';
      case 'error':
      case 'no_market':
      case 'pending_customer_info_update': // requires user action we can't automate server-side
        return raw === 'error' || raw === 'no_market' ? 'ERROR' : 'PENDING_USER_TRANSFER';
      default:
        this.logger.warn(`Unmapped SEP-24 status "${raw}" -> ERROR`);
        return 'ERROR';
    }
  }
}
