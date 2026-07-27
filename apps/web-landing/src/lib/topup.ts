/*
  Pure top-up (on-ramp) decision helpers for the pay flow — provider-agnostic.
  Computes WHETHER and HOW MUCH to top up; never WHICH provider (that is
  resolved later through the ramps registry).
*/

export interface TopUpDecision {
  insufficient: boolean;
  shortfall: number;
}

export function computeTopUp(
  requiredAmount: number | string | null | undefined,
  availableBalance: number | string | null | undefined
): TopUpDecision {
  const required = Number(requiredAmount ?? 0);
  const available = Number(availableBalance ?? 0);
  if (!Number.isFinite(required) || required <= 0) {
    return { insufficient: false, shortfall: 0 };
  }
  const safeAvailable = Number.isFinite(available) ? available : 0;
  if (safeAvailable >= required) return { insufficient: false, shortfall: 0 };
  return { insufficient: true, shortfall: required - safeAvailable };
}

export function buildTopUpQuery(shortfall: number, returnTo: string): string {
  return new URLSearchParams({
    topup: shortfall > 0 ? shortfall.toFixed(2) : "",
    returnTo,
  }).toString();
}
