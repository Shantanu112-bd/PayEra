import { Wallet, PaginationResponse } from "@cryptopay/types";
import { ApiClient } from "../core/ApiClient";

export class WalletsSdk {
  constructor(private client: ApiClient) {}

  async connectWallet(publicKey: string, signedPayload: string, label?: string): Promise<Wallet> {
    return this.client.post<Wallet>("/wallets", { publicKey, signedPayload, label });
  }

  async getWallet(walletId: string): Promise<Wallet> {
    return this.client.get<Wallet>(`/wallets/${walletId}`);
  }

  async updateWallet(walletId: string, data: Partial<Wallet>): Promise<Wallet> {
    return this.client.patch<Wallet>(`/wallets/${walletId}`, data);
  }

  async listWallets(): Promise<PaginationResponse<Wallet>> {
    return this.client.get<PaginationResponse<Wallet>>("/wallets");
  }

  async disconnect(walletId: string): Promise<void> {
    return this.client.delete<void>(`/wallets/${walletId}`);
  }
}
