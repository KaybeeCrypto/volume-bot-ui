// types/referral.ts

export type ReferralAccount = {
  referralCode: string;

  referralLink: string;

  // Commission percentage (e.g. 0.15 = 15%)
  commissionRate: number;

  // Earnings
  pendingBalanceSol: number;
  lifetimeEarnedSol: number;

  // Payout
  payoutWallet?: string;
  nextPayoutAt?: string;
};