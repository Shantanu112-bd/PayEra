import { ApiClient } from '../core/ApiClient';

export type RampType = 'ONRAMP' | 'OFFRAMP';
export type RampProviderId = 'MONEYGRAM';
export type RampStatus =
  | 'INITIATED'
  | 'PENDING_USER_TRANSFER'
  | 'PENDING_ANCHOR'
  | 'PENDING_STELLAR'
  | 'PENDING_EXTERNAL'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'EXPIRED'
  | 'ERROR';

export interface RampProviderInfo {
  id: RampProviderId;
  supportsOnRamp: boolean;
  supportsOffRamp: boolean;
  supportsStatusCallback: boolean;
}

export interface InitiateRampInput {
  providerId: RampProviderId;
  userStellarAddress: string;
  amount?: string;
  assetCode?: string;
}

export interface RampInitiateResult {
  id: string;
  provider: RampProviderId;
  type: RampType;
  status: RampStatus;
  interactiveUrl: string | null;
  providerTxId: string | null;
}

export interface RampTransaction {
  id: string;
  provider: RampProviderId;
  type: RampType;
  status: RampStatus;
  userStellarAddress: string;
  assetCode: string;
  amountIn: string | null;
  amountOut: string | null;
  amountFee: string | null;
  interactiveUrl: string | null;
  referenceNumber: string | null;
  stellarMemo: string | null;
  anchorAccount: string | null;
  stellarTxHash: string | null;
  failureMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RampHistoryResponse {
  items: RampTransaction[];
  meta: { page: number; limit: number; total: number; pageCount: number };
}

export class RampsClient {
  constructor(private readonly client: ApiClient) {}

  /** List available providers and their capabilities. */
  async listProviders() {
    return this.client.get<RampProviderInfo[]>('/ramps/providers');
  }

  /** Fiat -> crypto (cash-in). */
  async initiateOnRamp(input: InitiateRampInput) {
    return this.client.post<RampInitiateResult>('/ramps/onramp', input);
  }

  /** Crypto -> fiat (cash-out / pickup). Amount required. */
  async initiateOffRamp(input: InitiateRampInput & { amount: string }) {
    return this.client.post<RampInitiateResult>('/ramps/offramp', input);
  }

  /** Paginated ramp history for the current user. */
  async history(params: { page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return this.client.get<RampHistoryResponse>(`/ramps/history${qs ? `?${qs}` : ''}`);
  }

  /** Fetch a single ramp by its public id. */
  async get(id: string) {
    return this.client.get<RampTransaction>(`/ramps/${id}`);
  }
}
