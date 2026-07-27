"use client";

/*
  Graceful Freighter wrapper.

  Freighter may be absent (no extension installed, or SSR). Every call here
  either resolves to a well-typed "not available" result or throws a
  human-readable error — callers never see an undefined window.freighter.
  We import the API lazily so the bundle doesn't assume the extension exists.
*/

export interface FreighterState {
  installed: boolean;
  allowed: boolean;
  address: string | null;
}

async function api() {
  // Lazy import keeps this out of the SSR path.
  return await import("@stellar/freighter-api");
}

export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { isConnected } = await api();
    const res = await isConnected();
    // v6 returns { isConnected: boolean }
    return typeof res === "object" ? !!res.isConnected : !!res;
  } catch {
    return false;
  }
}

export async function connectFreighter(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Freighter is only available in the browser.");
  }
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      "Freighter wallet not detected. Install the Freighter browser extension to continue."
    );
  }
  const { requestAccess, getAddress } = await api();
  try {
    await requestAccess();
  } catch {
    throw new Error("Wallet connection was declined.");
  }
  const addrRes = await getAddress();
  const address =
    typeof addrRes === "object" ? addrRes.address : (addrRes as string);
  if (!address) throw new Error("Could not read your Stellar address.");
  return address;
}

export async function signMessageWithFreighter(
  message: string,
  address: string
): Promise<string> {
  const { signMessage } = await api();
  const res = await signMessage(message, { address });
  // v6 may return { signedMessage } as string or Buffer-like.
  const signed =
    typeof res === "object" && res !== null && "signedMessage" in res
      ? (res as { signedMessage: unknown }).signedMessage
      : res;
  if (typeof signed === "string") return signed;
  // Buffer / Uint8Array → base64
  if (signed instanceof Uint8Array) {
    return btoa(String.fromCharCode(...signed));
  }
  // Some builds return { data: Buffer }
  const maybe = signed as { data?: number[] } | null;
  if (maybe?.data) return btoa(String.fromCharCode(...maybe.data));
  throw new Error("Unexpected signature format from Freighter.");
}

export async function signTxWithFreighter(
  xdr: string,
  networkPassphrase: string,
  address: string
): Promise<string> {
  const { signTransaction } = await api();
  const res = await signTransaction(xdr, { networkPassphrase, address });
  return typeof res === "object" && res !== null && "signedTxXdr" in res
    ? (res as { signedTxXdr: string }).signedTxXdr
    : (res as unknown as string);
}
