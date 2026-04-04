"use client";

import { useEffect, useState } from "react";
import type { TierConfig } from "@/lib/tiers";

type PurchaseTierModalProps = {
  open: boolean;
  tier: TierConfig | null;
  onClose: () => void;
  onPaymentComplete: (tier: TierConfig) => void;
};

const PAYMENT_WALLET_ADDRESS = "REPLACE_WITH_YOUR_SOL_WALLET_ADDRESS";

export default function PurchaseTierModal({
  open,
  tier,
  onClose,
  onPaymentComplete,
}: PurchaseTierModalProps) {
  const [step, setStep] = useState<"summary" | "payment">("summary");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("summary");
      setCopied(false);
    }
  }, [open, tier]);

  if (!open || !tier) return null;

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_WALLET_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl rounded-[28px] border border-white/60 bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Purchase Flow
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-black">
              {step === "summary" ? "Review Tier" : "Payment"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-lg leading-none text-gray-400 transition hover:bg-gray-100 hover:text-black"
            aria-label="Close purchase modal"
          >
            ×
          </button>
        </div>

        {step === "summary" ? (
          <>
            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Selected Tier
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-black">{tier.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{tier.subtitle}</p>
                </div>

                <div className="rounded-2xl bg-black px-4 py-3 text-center text-white">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                    Price
                  </p>
                  <p className="mt-1 text-2xl font-bold">{tier.priceSol} SOL</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                {tier.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4">
                <p className="text-sm font-medium text-black">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  After payment, you will be redirected to the dashboard to set up the bot.
                  The session will not start automatically.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-black px-5 py-3 font-semibold text-black transition hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep("payment")}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Continue to Payment
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Tier
                    </p>
                    <p className="mt-2 text-2xl font-bold text-black">{tier.name}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Amount
                    </p>
                    <p className="mt-2 text-2xl font-bold text-black">{tier.priceSol} SOL</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Send Payment To
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-black">
                    {PAYMENT_WALLET_ADDRESS}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyWallet}
                    className="mt-4 rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                  >
                    {copied ? "Copied" : "Copy Wallet Address"}
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <p className="text-sm font-medium text-black">Temporary flow</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Payment confirmation is currently a frontend placeholder. After real backend
                    payment sync is added, this step can be replaced with automatic verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("summary")}
                className="rounded-xl border border-black px-5 py-3 font-semibold text-black transition hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => onPaymentComplete(tier)}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                I Completed Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}