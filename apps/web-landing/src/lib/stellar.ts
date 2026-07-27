"use client";

import {
  Horizon,
  Asset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
  "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";
const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ||
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const STAR_CONTRACT = process.env.NEXT_PUBLIC_STAR_CONTRACT_ADDRESS || "";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;

export const horizon = new Horizon.Server(HORIZON_URL);

export interface Balances {
  XLM: string;
  USDC: string;
  STAR: string;
}

export async function fetchBalances(publicKey: string): Promise<Balances> {
  const out: Balances = { XLM: "0.00", USDC: "0.00", STAR: "0.00" };
  try {
    const account = await horizon.loadAccount(publicKey);
    for (const b of account.balances) {
      if (b.asset_type === "native") {
        out.XLM = parseFloat(b.balance).toFixed(2);
      } else if ("asset_code" in b) {
        if (b.asset_code === "USDC") out.USDC = parseFloat(b.balance).toFixed(2);
        else if (b.asset_code === "STAR")
          out.STAR = parseFloat(b.balance).toFixed(2);
      }
    }
  } catch {
    // Unfunded / not found — zero balances are the correct display.
  }
  // Prefer on-chain STAR from the reward contract when available.
  if (STAR_CONTRACT) {
    const s = await getStarBalance(publicKey);
    if (s !== null) out.STAR = s;
  }
  return out;
}

export async function getStarBalance(
  walletAddress: string
): Promise<string | null> {
  if (!STAR_CONTRACT) return null;
  try {
    const server = new rpc.Server(SOROBAN_RPC_URL);
    const contract = new Contract(STAR_CONTRACT);
    const account = await server.getAccount(walletAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call("balance", nativeToScVal(Address.fromString(walletAddress)))
      )
      .setTimeout(30)
      .build();
    const res = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(res) && res.result) {
      return scValToNative(res.result.retval).toString();
    }
    return "0";
  } catch {
    return null;
  }
}

const usdcAsset = () => new Asset("USDC", USDC_ISSUER);

export async function hasUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const account = await horizon.loadAccount(publicKey);
    return account.balances.some(
      (b) =>
        b.asset_type === "credit_alphanum4" &&
        b.asset_code === "USDC" &&
        b.asset_issuer === USDC_ISSUER
    );
  } catch {
    return false;
  }
}

/** Build a changeTrust XDR for the caller to sign with Freighter. */
export async function buildUsdcTrustlineXdr(publicKey: string): Promise<string> {
  const account = await horizon.loadAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: usdcAsset() }))
    .setTimeout(120)
    .build();
  return tx.toXDR();
}

/** Build a USDC payment XDR (used by off-ramp to fund the anchor account). */
export async function buildUsdcPaymentXdr(
  from: string,
  destination: string,
  amount: string,
  memoText?: string
): Promise<string> {
  const { Memo } = await import("@stellar/stellar-sdk");
  const account = await horizon.loadAccount(from);
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({ destination, asset: usdcAsset(), amount })
    )
    .setTimeout(120);
  if (memoText) builder.addMemo(Memo.text(memoText));
  return builder.build().toXDR();
}

export async function submitSignedXdr(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const res = await horizon.submitTransaction(tx);
  return res.hash;
}
