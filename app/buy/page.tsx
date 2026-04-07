"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TIERS, getTierByKey } from "@/lib/tiers";
import type { TierConfig, TierKey } from "@/types/tier";

type BuyStep = 1 | 2 | 3 | 4 | 5;

function formatDuration(hours: number) {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days}d`;
  }

  return `${hours}h`;
}

function isLikelySolanaAddress(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 32 && trimmed.length <= 44;
}

function getStepStatus(currentStep: BuyStep, targetStep: BuyStep) {
  if (currentStep === targetStep) return "current";
  if (currentStep > targetStep) return "complete";
  return "upcoming";
}

export default function BuyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTierKey = searchParams.get("tier") as TierKey | null;

  const [step, setStep] = useState<BuyStep>(1);
  const [selectedTier, setSelectedTier] = useState<TierConfig | null>(null);

  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenTouched, setTokenTouched] = useState(false);

  const [walletCount, setWalletCount] = useState("");
  const [solPerWallet, setSolPerWallet] = useState("");

  const [returnWallet, setReturnWallet] = useState("");
  const [returnWalletTouched, setReturnWalletTouched] = useState(false);

  useEffect(() => {
    if (!initialTierKey) return;

    const tier = getTierByKey(initialTierKey);
    if (!tier) return;

    setSelectedTier(tier);

    if (!tier.managed) {
      setStep(2);
    }
  }, [initialTierKey]);

  useEffect(() => {
    if (!selectedTier) return;
    setWalletCount(String(selectedTier.walletCount));
  }, [selectedTier]);

  const tokenValid = useMemo(() => {
    return isLikelySolanaAddress(tokenAddress);
  }, [tokenAddress]);

  const returnWalletValid = useMemo(() => {
    return isLikelySolanaAddress(returnWallet);
  }, [returnWallet]);

  const parsedWalletCount = Number(walletCount);
  const parsedSolPerWallet = Number(solPerWallet);

  const walletConfigValid =
    Number.isFinite(parsedWalletCount) &&
    parsedWalletCount > 0 &&
    Number.isFinite(parsedSolPerWallet) &&
    parsedSolPerWallet > 0;

  const estimatedTradingCapital = walletConfigValid
    ? parsedWalletCount * parsedSolPerWallet
    : 0;

  const canGoStep2 = !!selectedTier && !selectedTier.managed;
  const canGoStep3 = canGoStep2 && tokenValid;
  const canGoStep4 = canGoStep3 && walletConfigValid;
  const canGoStep5 = canGoStep4 && returnWalletValid;

  function goNext() {
    if (step === 1) {
      if (canGoStep2) setStep(2);
      return;
    }

    if (step === 2) {
      setTokenTouched(true);
      if (canGoStep3) setStep(3);
      return;
    }

    if (step === 3) {
      if (canGoStep4) setStep(4);
      return;
    }

    if (step === 4) {
      setReturnWalletTouched(true);
      if (canGoStep5) setStep(5);
    }
  }

  function goBack() {
    if (step > 1) {
      setStep((prev) => (prev - 1) as BuyStep);
    }
  }

  function handleSelectTier(tier: TierConfig) {
    setSelectedTier(tier);

    if (tier.managed) {
      setStep(1);
      return;
    }

    setStep(2);
  }

  function handleCreatePayment() {
    if (!selectedTier || !canGoStep5) return;

    alert(
      `Next step: create payment order for ${selectedTier.name}

Token: ${tokenAddress}
Wallets: ${walletCount}
SOL per wallet: ${solPerWallet}
Return wallet: ${returnWallet}`
    );
  }

  const stepTitles = [
    "Select Tier",
    "Token",
    "Wallets",
    "Return Wallet",
    "Review",
  ] as const;

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-black dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-500 transition hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            ← Back to home
          </button>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
            Buy Session
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Create your Volbot session
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-gray-600 dark:text-white/60">
            Follow the purchase flow: choose a tier, enter your token,
            configure wallets, set your return wallet, then review everything
            before payment.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 md:p-8">
            <div className="mb-8 grid gap-3 sm:grid-cols-5">
              {stepTitles.map((title, index) => {
                const targetStep = (index + 1) as BuyStep;
                const status = getStepStatus(step, targetStep);

                return (
                  <div
                    key={title}
                    className={`rounded-2xl border px-4 py-4 text-center ${
                      status === "current"
                        ? "border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-400/10"
                        : status === "complete"
                        ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-400/10"
                        : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        status === "current"
                          ? "bg-cyan-500 text-white dark:bg-cyan-400 dark:text-slate-950"
                          : status === "complete"
                          ? "bg-green-500 text-white dark:bg-green-400 dark:text-slate-950"
                          : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {targetStep}
                    </div>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-white/55">
                      {title}
                    </p>
                  </div>
                );
              })}
            </div>

            {step === 1 && (
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Step 1
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Select your tier
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600 dark:text-white/60">
                  Self-serve tiers continue directly into session setup.
                  Managed tiers require support coordination.
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {TIERS.map((tier) => {
                    const isSelected = selectedTier?.key === tier.key;
                    const isManaged = tier.managed;

                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => handleSelectTier(tier)}
                        className={`rounded-3xl border p-6 text-left transition ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50 shadow-md dark:border-cyan-400 dark:bg-cyan-400/10"
                            : "border-gray-200 bg-white hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-white/40">
                              {tier.name}
                            </p>
                            <p className="mt-3 text-3xl font-bold">
                              {tier.priceSol} SOL
                            </p>
                          </div>

                          {isManaged && (
                            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white dark:bg-white dark:text-black">
                              Managed
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-sm text-gray-500 dark:text-white/60">
                          {formatDuration(tier.durationHours)} ·{" "}
                          {tier.walletCount} wallets
                        </p>

                        <ul className="mt-5 space-y-2 text-sm text-gray-600 dark:text-white/70">
                          {tier.features.map((feature) => (
                            <li key={feature}>✔ {feature}</li>
                          ))}
                        </ul>

                        <div className="mt-6">
                          <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                            {isManaged
                              ? "Support setup required"
                              : "Continue setup"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedTier?.managed && (
                  <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <h3 className="text-lg font-semibold">
                      {selectedTier.name} is a managed tier
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-white/70">
                      This package is not configured through the normal self-serve
                      flow. Contact support for setup and coordination.
                    </p>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() =>
                          window.open("https://t.me/pmprv1_bot", "_blank")
                        }
                        className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
                      >
                        Contact Support
                      </button>

                      <button
                        onClick={() => setSelectedTier(null)}
                        className="rounded-xl border border-black px-5 py-3 font-semibold transition hover:bg-gray-100 dark:border-white dark:hover:bg-white/10"
                      >
                        Choose another tier
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Step 2
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Enter your token address
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600 dark:text-white/60">
                  Paste your token contract address. For now this page only does
                  basic front-end validation. Later this will connect to real
                  on-chain checks.
                </p>

                <div className="mt-8">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
                    Token contract address
                  </label>

                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    onBlur={() => setTokenTouched(true)}
                    placeholder="Paste Solana token address"
                    className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950"
                  />

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold">Validation status</p>

                    {!tokenAddress.trim() && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-white/55">
                        Enter a token address to continue.
                      </p>
                    )}

                    {tokenAddress.trim() && tokenValid && (
                      <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-white/70">
                        <p>✔ Address format looks valid</p>
                        <p>✔ Ready for server-side token validation later</p>
                      </div>
                    )}

                    {tokenTouched && tokenAddress.trim() && !tokenValid && (
                      <div className="mt-3 space-y-2 text-sm text-red-600 dark:text-red-300">
                        <p>Address format does not look valid yet.</p>
                        <p>
                          Solana addresses are usually between 32 and 44
                          characters.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Step 3
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Configure wallets
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600 dark:text-white/60">
                  Set wallet count and SOL per wallet. Right now the selected
                  tier pre-fills the wallet count, but you can still adjust it
                  during the front-end build stage.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
                      Number of wallets
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={walletCount}
                      onChange={(e) => setWalletCount(e.target.value)}
                      className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
                      SOL per wallet
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={solPerWallet}
                      onChange={(e) => setSolPerWallet(e.target.value)}
                      placeholder="0.15"
                      className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold">Wallet configuration summary</p>

                  {walletConfigValid ? (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-white/70">
                      <p>Wallets: {parsedWalletCount}</p>
                      <p>SOL per wallet: {parsedSolPerWallet}</p>
                      <p>
                        Estimated trading capital: {estimatedTradingCapital.toFixed(2)} SOL
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500 dark:text-white/55">
                      Enter a valid wallet count and SOL amount greater than zero.
                    </p>
                  )}
                </div>
              </section>
            )}

            {step === 4 && (
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Step 4
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Enter your return wallet
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600 dark:text-white/60">
                  This is the wallet that receives unused SOL back after the
                  session ends or is stopped early.
                </p>

                <div className="mt-8">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">
                    Return wallet address
                  </label>

                  <input
                    type="text"
                    value={returnWallet}
                    onChange={(e) => setReturnWallet(e.target.value)}
                    onBlur={() => setReturnWalletTouched(true)}
                    placeholder="Paste your Phantom or Solflare wallet address"
                    className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-950"
                  />

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                    {!returnWallet.trim() && (
                      <p className="text-sm text-gray-500 dark:text-white/55">
                        Enter the wallet that should receive remaining SOL.
                      </p>
                    )}

                    {returnWallet.trim() && returnWalletValid && (
                      <div className="space-y-2 text-sm text-gray-700 dark:text-white/70">
                        <p>✔ Return wallet format looks valid</p>
                        <p>✔ This wallet will be used for session settlement</p>
                      </div>
                    )}

                    {returnWalletTouched &&
                      returnWallet.trim() &&
                      !returnWalletValid && (
                        <div className="space-y-2 text-sm text-red-600 dark:text-red-300">
                          <p>Return wallet format does not look valid yet.</p>
                          <p>
                            Use a valid Solana wallet address you control.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </section>
            )}

            {step === 5 && selectedTier && (
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Step 5
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Review your session order
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600 dark:text-white/60">
                  Check the full configuration before moving to payment.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                      Tier
                    </p>
                    <p className="mt-3 text-2xl font-bold">{selectedTier.name}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                      {selectedTier.priceSol} SOL ·{" "}
                      {formatDuration(selectedTier.durationHours)} ·{" "}
                      {selectedTier.walletCount} wallets
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                      Payment rules
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-white/70">
                      <p>• Payment window: 3 hours</p>
                      <p>• Send the exact amount in one transaction</p>
                      <p>• Session fee is non-refundable after START</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/5 md:col-span-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                      Session details
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                          Token address
                        </p>
                        <p className="mt-2 break-all text-sm text-gray-700 dark:text-white/75">
                          {tokenAddress}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                          Return wallet
                        </p>
                        <p className="mt-2 break-all text-sm text-gray-700 dark:text-white/75">
                          {returnWallet}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                          Wallet count
                        </p>
                        <p className="mt-2 text-sm text-gray-700 dark:text-white/75">
                          {walletCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                          SOL per wallet
                        </p>
                        <p className="mt-2 text-sm text-gray-700 dark:text-white/75">
                          {solPerWallet}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                          Estimated trading capital
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {estimatedTradingCapital.toFixed(2)} SOL
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="rounded-xl border border-black px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100 dark:border-white dark:hover:bg-white/10"
              >
                Back
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreatePayment}
                    className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
                  >
                    Create Payment Order
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-500">
              Order Summary
            </p>

            {!selectedTier ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-5 dark:border-white/10">
                <p className="text-sm text-gray-500 dark:text-white/55">
                  No tier selected yet. Choose a tier to begin the session
                  setup flow.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="rounded-2xl bg-gray-50 p-5 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-bold">{selectedTier.name}</h3>

                    {selectedTier.managed && (
                      <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white dark:bg-white dark:text-black">
                        Managed
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                    {selectedTier.priceSol} SOL ·{" "}
                    {formatDuration(selectedTier.durationHours)}
                  </p>

                  <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-white/70">
                    {selectedTier.features.map((feature) => (
                      <li key={feature}>✔ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 dark:border-white/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                    Current setup
                  </p>

                  <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-white/70">
                    <div className="flex items-start justify-between gap-4">
                      <span>Token</span>
                      <span className="max-w-[180px] break-all text-right">
                        {tokenAddress || "—"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span>Wallets</span>
                      <span>{walletCount || "—"}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span>SOL per wallet</span>
                      <span>{solPerWallet || "—"}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span>Return wallet</span>
                      <span className="max-w-[180px] break-all text-right">
                        {returnWallet || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5 dark:border-white/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-white/40">
                    Estimated trading capital
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {walletConfigValid
                      ? `${estimatedTradingCapital.toFixed(2)} SOL`
                      : "—"}
                  </p>

                  <p className="mt-2 text-sm text-gray-500 dark:text-white/55">
                    This is a front-end estimate only for now.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}