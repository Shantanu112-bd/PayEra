import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  Address,
  Horizon,
  rpc
} from '@stellar/stellar-sdk';
import { signTransaction, setAllowed } from "@stellar/freighter-api";

// Use Stellar Testnet
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

export const server = new Horizon.Server(HORIZON_URL);
export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// Mock Contract IDs since they aren't deployed yet for the demo
export const CONTRACTS = {
  paymentEngine: process.env.NEXT_PUBLIC_PAYMENT_ENGINE_CONTRACT_ADDRESS || "",
  starToken: process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS || "",
  usdc: "CBXYZ...", // Native USDC token address on testnet
};

export interface BalanceMap {
  XLM: string;
  USDC: string;
  STAR: string;
}

export async function fetchBalances(publicKey: string): Promise<BalanceMap> {
  const balances: BalanceMap = { XLM: "0.00", USDC: "0.00", STAR: "0.00" };
  try {
    const account = await server.loadAccount(publicKey);
    account.balances.forEach((balance) => {
      if (balance.asset_type === "native") {
        balances.XLM = parseFloat(balance.balance).toFixed(2);
      } else if ("asset_code" in balance) {
        if (balance.asset_code === "USDC") {
          balances.USDC = parseFloat(balance.balance).toFixed(2);
        } else if (balance.asset_code === "STAR") {
          balances.STAR = parseFloat(balance.balance).toFixed(2);
        }
      }
    });
  } catch (e) {
    console.error("Error fetching balances for account", publicKey, e);
  }
  return balances;
}

export async function getStarBalanceFromContract(walletAddress: string): Promise<string> {
  try {
    const rpcServer = new rpc.Server(
      process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
    )
    const contract = new Contract(process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS!)
    const account = await rpcServer.getAccount(walletAddress)
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'balance',
          nativeToScVal(Address.fromString(walletAddress))
        )
      )
      .setTimeout(30)
      .build()

    const result = await rpcServer.simulateTransaction(tx)
    
    if (rpc.Api.isSimulationSuccess(result) && result.result) {
      return scValToNative(result.result.retval).toString()
    }
    return '0'
  } catch (e) {
    console.error('Contract balance read failed:', e)
    return '0'
  }
}
