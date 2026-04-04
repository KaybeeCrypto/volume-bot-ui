export const TIER_KEYS = ["trial", "basic", "standard", "pro"] as const;

export type TierKey = (typeof TIER_KEYS)[number];

export type TierConfig = {
  key: TierKey;
  name: string;
  priceSol: string;
  subtitle: string;
  features: readonly string[];
  badge?: string;
};

export const TIERS: Record<TierKey, TierConfig> = {
  trial: {
    key: "trial",
    name: "Trial",
    priceSol: "0.8",
    subtitle: "Best for testing the flow",
    features: [
      "Entry-level session",
      "Volume generation",
      "Clear setup flow",
      "Fast launch",
    ],
  },
  basic: {
    key: "basic",
    name: "Basic",
    priceSol: "1.8",
    subtitle: "Solid starting point for smaller launches",
    features: [
      "Reliable activity boost",
      "Volume generation",
      "Good budget balance",
      "Straightforward setup",
    ],
  },
  standard: {
    key: "standard",
    name: "Standard",
    priceSol: "3.2",
    subtitle: "Best balance of cost and visible impact",
    features: [
      "Stronger activity profile",
      "Volume generation",
      "Better social proof effect",
      "Ideal default choice",
    ],
    badge: "Most Popular",
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceSol: "5.5",
    subtitle: "For bigger pushes and stronger session coverage",
    features: [
      "Higher session intensity",
      "Volume generation",
      "Broader visible activity",
      "Premium tier option",
    ],
  },
};

export const TIER_LIST: TierConfig[] = TIER_KEYS.map((key) => TIERS[key]);

export function getTierByKey(key: TierKey): TierConfig {
  return TIERS[key];
}