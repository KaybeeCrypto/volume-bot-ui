export type TierKey = "trial" | "basic" | "standard" | "pro";

export type TierConfig = {
  key: TierKey;
  name: string;
  priceSol: string;
  subtitle: string;
  features: string[];
  badge?: string;
};

export const TIERS: Record<TierKey, TierConfig> = {
  trial: {
    key: "trial",
    name: "Trial",
    priceSol: "0.80",
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
    priceSol: "1.80",
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
    priceSol: "3.20",
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
    priceSol: "5.50",
    subtitle: "For bigger pushes and stronger session coverage",
    features: [
      "Higher session intensity",
      "Volume generation",
      "Broader visible activity",
      "Premium tier option",
    ],
  },
};