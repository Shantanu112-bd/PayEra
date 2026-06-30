import { User } from "@cryptopay/types";
import { ApiClient } from "../core/ApiClient";

export class AuthSdk {
  constructor(private client: ApiClient) {}

  async mockLogin(username: string): Promise<{ token: string; user: User }> {
    return this.client.post<{ token: string; user: User }>("/auth/mock-login", { username });
  }

  async walletChallenge(data: { address: string; network: string; provider: string }): Promise<{ message: string; nonce: string; expiresAt: string }> {
    return this.client.post<{ message: string; nonce: string; expiresAt: string }>("/auth/wallet/challenge", data);
  }

  async walletLogin(data: { address: string; network: string; provider: string; nonce: string; signature: string }): Promise<{ auth: { accessToken: string; refreshToken: string }; user: User }> {
    return this.client.post<{ auth: { accessToken: string; refreshToken: string }; user: User }>("/auth/wallet/login", data);
  }

  async getCurrentUser(): Promise<User> {
    return this.client.get<User>("/auth/me");
  }

  logout(): void {
    // Implementing client-side logout cleanup could go here, or handled by the host app via token clearing.
  }
  
  refreshToken(): Promise<{ token: string }> {
    // Placeholder if a refresh endpoint is added later.
    return this.client.post<{ token: string }>("/auth/refresh");
  }
}
