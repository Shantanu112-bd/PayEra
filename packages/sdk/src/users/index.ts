import { User } from "@cryptopay/types";
import { ApiClient } from "../core/ApiClient";

export class UsersSdk {
  constructor(private client: ApiClient) {}

  async getProfile(userId: string): Promise<User> {
    return this.client.get<User>(`/users/${userId}`);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.client.patch<User>(`/users/${userId}`, data);
  }

  async activate(userId: string): Promise<void> {
    return this.client.post(`/users/${userId}/activate`);
  }

  async suspend(userId: string): Promise<void> {
    return this.client.post(`/users/${userId}/suspend`);
  }

  async softDelete(userId: string): Promise<void> {
    return this.client.delete(`/users/${userId}`);
  }
}
