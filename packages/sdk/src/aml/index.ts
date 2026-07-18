import { ApiClient } from "../core/ApiClient";

export interface AmlScreeningResult {
  address: string;
  isHighRisk: boolean;
  score: number;
  flags: string[];
}

export class AmlSdk {
  constructor(private client: ApiClient) {}

  async screenWallet(address: string): Promise<AmlScreeningResult> {
    return this.client.get<AmlScreeningResult>(`/aml/screen?address=${address}`);
  }
}
