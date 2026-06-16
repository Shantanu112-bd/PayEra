import type { SettlementNetwork } from "@cryptopay/types";

export type CryptoPaySdkEnvironment = "local" | "testnet" | "mainnet";

export type CryptoPaySdkConfig = {
  apiBaseUrl: string;
  environment: CryptoPaySdkEnvironment;
  settlementNetwork: SettlementNetwork;
};
