import { WalletNetwork, WalletProvider, WalletStatus } from "./enums";

export interface Wallet {
  id: string;
  userId: string;
  provider: WalletProvider;
  network: WalletNetwork;
  address: string;
  addressNormalized: string;
  label: string | null;
  publicKey: string | null;
  status: WalletStatus;
  isPrimary: boolean;
  verifiedAt: Date | string | null;
  lastUsedAt: Date | string | null;
  metadata: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}
