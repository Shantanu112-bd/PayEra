export const STAR_PER_100_INR = 10n;
export const PAISE_PER_100_INR = 10_000n;
export const REFERRAL_REWARD_STAR = 100n;

export function calculateSpendRewardStar(amountInPaise: bigint): bigint {
  return (amountInPaise / PAISE_PER_100_INR) * STAR_PER_100_INR;
}
