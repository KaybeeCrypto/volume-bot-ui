// lib/tiers.ts

import type { TierConfig } from "@/types/tier";

export const TIERS: TierConfig[] = [
  {
    key: "basic",
    name: "Basic",
    priceSol: 1.5,
    durationHours: 24,
    walletCount: 10,
    features: ["Volume only"],
    managed: false,
  },
  {
    key: "standard",
    name: "Standard",
    priceSol: 3,
    durationHours: 24,
    walletCount: 30,
    features: ["Volume", "Rotation"],
    managed: false,
  },
  {
    key: "pro",
    name: "Pro",
    priceSol: 5,
    durationHours: 24,
    walletCount: 50,
    features: ["Volume", "Rotation", "Reactions"],
    managed: false,
  },
  {
    key: "alpha",
    name: "Alpha",
    priceSol: 25,
    durationHours: 48,
    walletCount: 200,
    features: ["Managed", "Blue chip", "Smart money"],
    managed: true,
  },
  {
    key: "launch_kit",
    name: "Launch Kit",
    priceSol: 45,
    durationHours: 48,
    walletCount: 500,
    features: ["Full package"],
    managed: true,
  },
];

// Helper: get tier by key
export function getTierByKey(key: string): TierConfig | undefined {
  return TIERS.find((t) => t.key === key);
}

// Helper: separate self-serve vs managed
export const SELF_SERVE_TIERS = TIERS.filter((t) => !t.managed);
export const MANAGED_TIERS = TIERS.filter((t) => t.managed);