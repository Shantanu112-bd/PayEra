/**
 * Pure decision helpers for the top-up (on-ramp) entry point in the pay flow.
 *
 * Extracted so the balance/shortfall logic is unit-testable without a React
 * runtime. This module is deliberately provider-agnostic: it computes *whether*
 * and *how much* to top up, never *which* ramp provider to use — provider
 * resolution happens later, through the ramps registry.
 */

export interface TopUpDecision {
  /** True when the on-chain balance cannot cover the quoted amount. */
  insufficient: boolean;
  /** Amount that must be topped up (0 when balance is sufficient). */
  shortfall: number;
}

/**
 * Decide whether a payment needs a top-up given the quoted asset amount the
 * user must pay and their current on-chain balance of that asset.
 *
 * Both inputs are parsed leniently (strings from quotes / Horizon); invalid or
 * missing values are treated as 0.
 */
export function computeTopUp(
  requiredAmount: number | string | null | undefined,
  availableBalance: number | string | null | undefined,
): TopUpDecision {
  const required = Number(requiredAmount ?? 0);
  const available = Number(availableBalance ?? 0);
  if (!Number.isFinite(required) || required <= 0) {
    return { insufficient: false, shortfall: 0 };
  }
  const safeAvailable = Number.isFinite(available) ? available : 0;
  if (safeAvailable >= required) {
    return { insufficient: false, shortfall: 0 };
  }
  return { insufficient: true, shortfall: required - safeAvailable };
}

/**
 * Build the query string for the shared on-ramp entry point. The pay flow only
 * knows about "an on-ramp" — it never names a provider here.
 */
export function buildTopUpQuery(shortfall: number, returnTo: string): string {
  const params = new URLSearchParams({
    topup: shortfall > 0 ? shortfall.toFixed(2) : "",
    returnTo,
  });
  return params.toString();
}
