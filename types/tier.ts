// types/tier.ts

export type TierKey =
  | "basic"
  | "standard"
  | "pro"
  | "alpha"
  | "launch_kit";

export type TierConfig = {
  key: TierKey;

  name: string;

  // Pricing
  priceSol: number;

  // Duration in hours (24, 48, etc.)
  durationHours: number;

  // Default wallet count included in tier
  walletCount: number;

  // Feature bullets for UI
  features: string[];

  // Managed tiers require support contact
  managed: boolean;
};