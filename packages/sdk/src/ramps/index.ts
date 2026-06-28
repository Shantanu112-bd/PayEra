import { ApiClient } from '../core/ApiClient';

export class RampsClient {
  constructor(private readonly client: ApiClient) {}

  async authenticate(userPublicKey: string) {
    return this.client.post<{ jwtToken: string }>('/ramps/authenticate', { userPublicKey })
  }

  async initiateDeposit(params: {
    userPublicKey: string
    amount?: string
    jwtToken: string
  }) {
    return this.client.post<{ interactiveUrl: string; transactionId: string }>('/ramps/deposit', params)
  }

  async initiateWithdrawal(params: {
    userPublicKey: string
    amount: string
    jwtToken: string
  }) {
    return this.client.post<{ interactiveUrl: string; transactionId: string }>('/ramps/withdraw', params)
  }

  async getTransactionStatus(params: { id: string; jwt: string }) {
    return this.client.get<{ status: string; memo?: string; withdrawAnchorAccount?: string; referenceNumber?: string }>(`/ramps/transaction/${params.id}?jwt=${params.jwt}`)
  }
}
