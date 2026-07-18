import { Merchant, PaginationResponse, Transaction } from "@cryptopay/types";
import { ApiClient } from "../core/ApiClient";

export class MerchantsSdk {
  constructor(private client: ApiClient) {}

  async getMerchant(merchantId: string): Promise<Merchant> {
    return this.client.get<Merchant>(`/merchants/${merchantId}`);
  }

  async listMerchants(): Promise<PaginationResponse<Merchant>> {
    return this.client.get<PaginationResponse<Merchant>>(`/merchants`);
  }

  async createMerchant(data: {
    legalName: string;
    displayName: string;
    defaultUpiVpa?: string;
    category?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    gstin?: string;
    metadata?: any;
  }): Promise<Merchant> {
    return this.client.post<Merchant>("/merchants", data);
  }

  async updateMerchant(merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
    return this.client.patch<Merchant>(`/merchants/${merchantId}`, data);
  }

  async createQrCode(merchantId: string, payload?: { amount?: string, storeId?: string }): Promise<any> {
    return this.client.post<any>(`/merchants/${merchantId}/qrs`, payload || {});
  }

  async getMyMerchant(): Promise<Merchant> {
    return this.client.get<Merchant>('/merchants/mine');
  }

  async findByVpa(vpa: string): Promise<Merchant | null> {
    return this.client.get<Merchant | null>(`/merchants/by-vpa/${vpa}`);
  }

  async getMerchantAnalytics(merchantId: string): Promise<any> {
    return this.client.get<any>(`/merchants/${merchantId}/analytics`);
  }

  async getMerchantTransactions(merchantId: string, params?: { page?: number; limit?: number }): Promise<PaginationResponse<Transaction>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    searchParams.set("merchantId", merchantId);
    
    return this.client.get<PaginationResponse<Transaction>>(`/transactions?${searchParams.toString()}`);
  }
}
