import { ApiClient } from "../core/ApiClient";

export interface StarBalanceResponse {
  address: string;
  starBalance: string;
  starBalanceFormatted: string;
}

export interface MerchantOnChainStatusResponse {
  merchantId: string;
  isApproved: boolean;
  onChainData: any;
}

export class StellarSdk {
  constructor(private client: ApiClient) {}

  async getStarBalance(address: string): Promise<StarBalanceResponse> {
    return this.client.get<StarBalanceResponse>(`/stellar/star-balance/${encodeURIComponent(address)}`);
  }

  async getMerchantStatus(merchantId: string): Promise<MerchantOnChainStatusResponse> {
    return this.client.get<MerchantOnChainStatusResponse>(`/stellar/merchant/${encodeURIComponent(merchantId)}/status`);
  }
}