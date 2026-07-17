import { Injectable, Logger } from '@nestjs/common';

interface DecentroConfig {
  clientId: string;
  clientSecret: string;
  moduleSecret: string;
  baseUrl: string;
}

interface DecentroAuthResponse {
  status: string;
  data: {
    access_token: string;
    expires_in: number;
    token_type: string;
  };
}

interface DecentroPayoutRequest {
  beneficiary_name: string;
  beneficiary_account_number: string;
  beneficiary_ifsc: string;
  amount: number;
  purpose: string;
  reference_id: string;
  upi_vpa?: string;
}

interface DecentroPayoutResponse {
  status: string;
  data: {
    transaction_id: string;
    status: string;
    reference_id: string;
    amount: number;
  };
}

interface DecentroStatusResponse {
  status: string;
  data: {
    transaction_id: string;
    status: string;
    reference_id: string;
    amount: number;
    utr_number?: string;
  };
}

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);
  private readonly config: DecentroConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: process.env.DECENTRO_CLIENT_ID || '',
      clientSecret: process.env.DECENTRO_CLIENT_SECRET || '',
      moduleSecret: process.env.DECENTRO_MODULE_SECRET || '',
      baseUrl: process.env.DECENTRO_BASE_URL || 'https://in.staging.decentro.tech',
    };

    if (!this.config.clientId || !this.config.clientSecret || !this.config.moduleSecret) {
      this.logger.warn('Decentro credentials not configured. UPI payouts will use mock mode.');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const url = `${this.config.baseUrl}/v2/auth/token`;
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'x-module-secret': this.config.moduleSecret,
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Decentro auth failed: ${response.status} ${error}`);
    }

    const data = await response.json() as DecentroAuthResponse;

    if (data.status !== 'success' || !data.data?.access_token) {
      throw new Error(`Decentro auth failed: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.data.access_token;
    this.tokenExpiry = Date.now() + data.data.expires_in * 1000;

    this.logger.log('Decentro access token obtained');
    return this.accessToken;
  }

  async initiateUpiPayout(params: {
    referenceId: string;
    amountPaise: bigint;
    merchantUpiVpa: string;
    merchantName: string;
    purpose: string;
  }): Promise<{ transactionId: string; status: string }> {
    // If Decentro not configured, use mock mode
    if (!this.config.clientId || !this.config.clientSecret || !this.config.moduleSecret) {
      this.logger.warn('Decentro not configured, using mock payout');
      return this.mockPayout(params);
    }

    const token = await this.getAccessToken();
    const amountInr = Number(params.amountPaise) / 100;

    const payoutRequest: DecentroPayoutRequest = {
      beneficiary_name: params.merchantName,
      beneficiary_account_number: '0000000000', // Not used for UPI
      beneficiary_ifsc: 'N/A', // Not used for UPI
      amount: amountInr,
      purpose: params.purpose,
      reference_id: params.referenceId,
      upi_vpa: params.merchantUpiVpa,
    };

    const url = `${this.config.baseUrl}/v2/payouts/upi`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-module-secret': this.config.moduleSecret,
      },
      body: JSON.stringify(payoutRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Decentro payout failed: ${response.status} ${error}`);
      throw new Error(`Decentro payout failed: ${response.status} ${error}`);
    }

    const data = await response.json() as DecentroPayoutResponse;

    if (data.status !== 'success') {
      throw new Error(`Decentro payout failed: ${JSON.stringify(data)}`);
    }

    this.logger.log(`Decentro UPI payout initiated: ${data.data.transaction_id} for ₹${amountInr}`);

    return {
      transactionId: data.data.transaction_id,
      status: data.data.status,
    };
  }

  async checkPayoutStatus(transactionId: string): Promise<{ status: string; utrNumber?: string | undefined }> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.moduleSecret) {
      return this.mockStatusCheck(transactionId);
    }

    const token = await this.getAccessToken();
    const url = `${this.config.baseUrl}/v2/payouts/status?transaction_id=${transactionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-module-secret': this.config.moduleSecret,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Decentro status check failed: ${response.status} ${error}`);
    }

    const data = await response.json() as DecentroStatusResponse;

    return {
      status: data.data.status,
      utrNumber: data.data.utr_number,
    };
  }

  private mockPayout(params: {
    referenceId: string;
    amountPaise: bigint;
    merchantUpiVpa: string;
    merchantName: string;
    purpose: string;
  }): { transactionId: string; status: string } {
    const mockTransactionId = `MOCK_${Date.now()}_${params.referenceId.slice(-8)}`;
    this.logger.log(`MOCK UPI payout: ${mockTransactionId} for ₹${Number(params.amountPaise) / 100} to ${params.merchantUpiVpa}`);
    return {
      transactionId: mockTransactionId,
      status: 'SUCCESS',
    };
  }

  private mockStatusCheck(transactionId: string): { status: string; utrNumber?: string } {
    return {
      status: 'SUCCESS',
      utrNumber: `UTR_${transactionId}`,
    };
  }
}