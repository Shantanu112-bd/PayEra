import { User, Merchant, Transaction, PaginationResponse } from "@cryptopay/types";
import { ApiClient } from "../core/ApiClient";

export class AdminSdk {
  constructor(private client: ApiClient) {}

  async getOverview(): Promise<any> {
    return this.client.get("/admin/overview");
  }

  async listUsers(params?: { page?: number; limit?: number }): Promise<PaginationResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    
    const queryStr = searchParams.toString();
    return this.client.get<PaginationResponse<User>>(`/users${queryStr ? "?" + queryStr : ""}`);
  }

  async listMerchants(params?: { page?: number; limit?: number }): Promise<PaginationResponse<Merchant>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    
    const queryStr = searchParams.toString();
    return this.client.get<PaginationResponse<Merchant>>(`/merchants${queryStr ? "?" + queryStr : ""}`);
  }

  async listPendingMerchants(): Promise<Merchant[]> {
    return this.client.get<Merchant[]>("/admin/merchants/pending");
  }

  async approveMerchant(id: string, reason?: string): Promise<void> {
    return this.client.post(`/admin/merchants/${id}/approve`, { reason });
  }

  async rejectMerchant(id: string, reason?: string): Promise<void> {
    return this.client.post(`/admin/merchants/${id}/reject`, { reason });
  }

  async suspendMerchant(id: string, reason?: string): Promise<void> {
    return this.client.post(`/admin/merchants/${id}/suspend`, { reason });
  }

  async listTransactions(params?: { page?: number; limit?: number }): Promise<PaginationResponse<Transaction>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    
    const queryStr = searchParams.toString();
    return this.client.get<PaginationResponse<Transaction>>(`/transactions${queryStr ? "?" + queryStr : ""}`);
  }
  async listRewards(params?: { page?: number; limit?: number }): Promise<PaginationResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    
    const queryStr = searchParams.toString();
    return this.client.get<PaginationResponse<any>>(`/admin/rewards${queryStr ? "?" + queryStr : ""}`);
  }

  async listLogs(params?: { page?: number; limit?: number }): Promise<PaginationResponse<any>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    
    const queryStr = searchParams.toString();
    return this.client.get<PaginationResponse<any>>(`/admin/logs${queryStr ? "?" + queryStr : ""}`);
  }
}
