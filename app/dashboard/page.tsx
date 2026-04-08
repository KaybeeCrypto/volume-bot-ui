"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLogout } from "@/hooks/useLogout";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useRequireSession } from "@/hooks/useRequireSession";
import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import DevDisclaimer from "@/components/DevDisclaimer";
import GeckoTerminalChart from "@/components/GeckoTerminalChart";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "@/components/ThemeProvider";

type SessionStatus = "Ready" | "Running" | "Paused" | "Stopped";

type DashboardSummary = {
  tokenName: string;
  tokenAddress: string;
  tokenAddressDisplay: string;
  geckoMode: "tokens" | "pools";
  cycleStatus: SessionStatus;
  tierName: string;
  totalWallets: number;
  maxPerWallet: string;
  totalPotentialUsage: string;
  returnWallet: string;
  buyInterval: string;
  sellInterval: string;
  slippage: string;
  executionMode: string;
  randomizeAmounts: boolean;
  autoStopOnLimit: boolean;
  completedCycles: number;
  buyCycles: number;
  sellCycles: number;
  maxCycles: number;
  dailyUsed: number;
  dailyLimit: number;
  activeWallets: number;
  idleWallets: number;
  failedWallets: number;
  remainingToday: number;
  estimatedCyclesLeft: number;
};

type OperatorConfig = {
  buyInterval: string;
  sellInterval: string;
  slippage: string;
  executionMode: string;
  maxCycles: string;
  randomizeAmounts: boolean;
  autoStopOnLimit: boolean;
};

type PurchaseConfig = {
  tokenAddress: string;
  tokenTicker: string;
  wallets: string;
  maxPerWallet: string;
  dailyLimit: string;
  returnWallet: string;
};

const OPERATOR_CONFIG_STORAGE_KEY = "pmpr_operator_config";

const defaultOperatorConfig: OperatorConfig = {
  buyInterval: "15s",
  sellInterval: "15s",
  slippage: "1%",
  executionMode: "Balanced",
  maxCycles: "200",
  randomizeAmounts: true,
  autoStopOnLimit: true,
};

const defaultPurchaseConfig: PurchaseConfig = {
  tokenAddress: "",
  tokenTicker: "",
  wallets: "24",
  maxPerWallet: "0.15",
  dailyLimit: "20",
  returnWallet: "",
};

function shortenAddress(address?: string | null) {
  if (!address) return "Not configured";
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatSol(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(numeric)) return "0.00 SOL";
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 2)} SOL`;
}

export default function VolumeBotDashboardPage() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("Ready");
  const [menuOpen, setMenuOpen] = useState(false);

  const [configuredTokenAddress, setConfiguredTokenAddress] = useState("");
  const [configuredTokenTicker, setConfiguredTokenTicker] = useState("");
  const [operatorSaveMessage, setOperatorSaveMessage] = useState("");

  const [purchaseConfig, setPurchaseConfig] = useState<PurchaseConfig>(defaultPurchaseConfig);
  const [operatorConfig, setOperatorConfig] = useState<OperatorConfig>(defaultOperatorConfig);

  const [pendingPurchase, setPendingPurchase] = useState<null | {
    tierKey: string;
    tierName: string;
    priceSol: string;
    purchasedAt: number;
    setupRequired: boolean;
  }>(null);

  const { session, loading: sessionLoading, refreshSession } = useAuthSession();
  const { disconnect, select } = useWallet();
  const { theme } = useTheme();

  const { handleLogout } = useLogout({
    disconnectWallet: async () => {
      try {
        await disconnect();
      } catch {}

      try {
        select(null);
      } catch {}

      try {
        localStorage.removeItem("walletName");
      } catch {}
    },
    onLoggedOut: async () => {
      await refreshSession();
      setMenuOpen(false);
    },
  });

  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem("pmpr_chart_token_address");
      const savedTicker = localStorage.getItem("pmpr_chart_token_ticker");
      const savedOperatorConfig = localStorage.getItem(OPERATOR_CONFIG_STORAGE_KEY);
      const rawPendingPurchase = localStorage.getItem("pmpr_pending_purchase");

      const nextPurchaseConfig: PurchaseConfig = {
        tokenAddress: savedAddress || "",
        tokenTicker: savedTicker || "",
        wallets:
          localStorage.getItem("pmpr_wallet_count") ||
          localStorage.getItem("pmpr_wallets_to_execute") ||
          defaultPurchaseConfig.wallets,
        maxPerWallet:
          localStorage.getItem("pmpr_max_wallet_balance") ||
          localStorage.getItem("pmpr_per_wallet_balance") ||
          defaultPurchaseConfig.maxPerWallet,
        dailyLimit: localStorage.getItem("pmpr_daily_limit") || defaultPurchaseConfig.dailyLimit,
        returnWallet:
          localStorage.getItem("pmpr_return_wallet") ||
          localStorage.getItem("pmpr_unused_sol_wallet") ||
          "",
      };

      setPurchaseConfig(nextPurchaseConfig);
      setConfiguredTokenAddress(nextPurchaseConfig.tokenAddress);
      setConfiguredTokenTicker(nextPurchaseConfig.tokenTicker);

      if (savedOperatorConfig) {
        const parsed = JSON.parse(savedOperatorConfig) as Partial<OperatorConfig>;
        setOperatorConfig((prev) => ({
          ...prev,
          ...parsed,
        }));
      }

      if (rawPendingPurchase) {
        const parsed = JSON.parse(rawPendingPurchase);
        setPendingPurchase(parsed);
      }
    } catch {
      setPendingPurchase(null);
    }
  }, []);

  useBodyScrollLock(menuOpen);
  useRequireSession(sessionLoading, session);

  const walletsNumber = Number(purchaseConfig.wallets) || 0;
  const maxPerWalletNumber = Number(purchaseConfig.maxPerWallet) || 0;
  const dailyLimitNumber = Number(purchaseConfig.dailyLimit) || 0;
  const maxCyclesNumber = Number(operatorConfig.maxCycles) || 0;

  const activeWallets =
    sessionStatus === "Stopped"
      ? 0
      : sessionStatus === "Paused"
      ? Math.max(Math.min(6, walletsNumber), 0)
      : Math.min(18, walletsNumber || 18);

  const dailyUsed = sessionStatus === "Ready" ? 0 : sessionStatus === "Stopped" ? 0 : 12;
  const remainingToday = Math.max(dailyLimitNumber - dailyUsed, 0);
  const totalPotentialUsage = walletsNumber * maxPerWalletNumber;

  const summary = useMemo<DashboardSummary>(
    () => ({
      tokenName: configuredTokenTicker || "Not configured",
      tokenAddress: configuredTokenAddress,
      tokenAddressDisplay: shortenAddress(configuredTokenAddress),
      geckoMode: "tokens",
      cycleStatus: sessionStatus,
      tierName: pendingPurchase?.tierName || "Active Tier",
      totalWallets: walletsNumber || 24,
      maxPerWallet: formatSol(maxPerWalletNumber || 0.15),
      totalPotentialUsage: formatSol(totalPotentialUsage || 3.6),
      returnWallet: shortenAddress(purchaseConfig.returnWallet),
      buyInterval: operatorConfig.buyInterval,
      sellInterval: operatorConfig.sellInterval,
      slippage: operatorConfig.slippage,
      executionMode: operatorConfig.executionMode,
      randomizeAmounts: operatorConfig.randomizeAmounts,
      autoStopOnLimit: operatorConfig.autoStopOnLimit,
      completedCycles: sessionStatus === "Ready" || sessionStatus === "Stopped" ? 0 : 128,
      buyCycles: sessionStatus === "Ready" || sessionStatus === "Stopped" ? 0 : 64,
      sellCycles: sessionStatus === "Ready" || sessionStatus === "Stopped" ? 0 : 64,
      maxCycles: maxCyclesNumber || 200,
      dailyUsed,
      dailyLimit: dailyLimitNumber || 20,
      activeWallets,
      idleWallets: Math.max((walletsNumber || 24) - activeWallets - 2, 0),
      failedWallets: sessionStatus === "Ready" || sessionStatus === "Stopped" ? 0 : Math.min(2, walletsNumber || 2),
      remainingToday,
      estimatedCyclesLeft:
        sessionStatus === "Ready" || sessionStatus === "Stopped" ? maxCyclesNumber || 200 : 53,
    }),
    [
      configuredTokenTicker,
      configuredTokenAddress,
      sessionStatus,
      pendingPurchase?.tierName,
      walletsNumber,
      maxPerWalletNumber,
      totalPotentialUsage,
      purchaseConfig.returnWallet,
      operatorConfig.buyInterval,
      operatorConfig.sellInterval,
      operatorConfig.slippage,
      operatorConfig.executionMode,
      operatorConfig.randomizeAmounts,
      operatorConfig.autoStopOnLimit,
      maxCyclesNumber,
      dailyUsed,
      dailyLimitNumber,
      activeWallets,
      remainingToday,
    ]
  );

  function updateOperatorConfig<K extends keyof OperatorConfig>(
    key: K,
    value: OperatorConfig[K]
  ) {
    setOperatorConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setOperatorSaveMessage("");
  }

  function handleSaveOperatorSettings() {
    try {
      localStorage.setItem(OPERATOR_CONFIG_STORAGE_KEY, JSON.stringify(operatorConfig));
      setOperatorSaveMessage("Operator settings saved successfully.");
    } catch {
      setOperatorSaveMessage("Could not save operator settings.");
    }
  }

  function handleResetOperatorSettings() {
    setOperatorConfig(defaultOperatorConfig);
    setOperatorSaveMessage("");
  }

  function handleResetCounters() {
    setSessionStatus("Stopped");
  }

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-slate-950 dark:text-white">
        <p className="text-sm text-black/60 dark:text-white/60">Checking session...</p>
      </main>
    );
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Overview", href: "/dashboard#overview" },
    { label: "Controls", href: "/dashboard#controls" },
    { label: "Wallets", href: "/dashboard#wallets" },
  ];

  const walletRows = [
    { address: "4rYd...8Pw2", status: "Active", lastAction: "Buy", lastTrade: "14:32" },
    { address: "8LaP...2Mn9", status: "Active", lastAction: "Sell", lastTrade: "14:31" },
    { address: "3KfQ...7Hs1", status: "Idle", lastAction: "Waiting", lastTrade: "14:30" },
    { address: "9RtM...5Qa4", status: "Failed", lastAction: "Skipped", lastTrade: "14:29" },
    { address: "2VnB...1Je8", status: "Active", lastAction: "Buy", lastTrade: "14:27" },
  ];

  const dailyUsagePercent =
    summary.dailyLimit > 0 ? Math.min((summary.dailyUsed / summary.dailyLimit) * 100, 100) : 0;
  const cycleUsagePercent =
    summary.maxCycles > 0
      ? Math.min((summary.completedCycles / summary.maxCycles) * 100, 100)
      : 0;

  const primaryCtaLabel =
    sessionStatus === "Running"
      ? "Bot Running"
      : sessionStatus === "Paused"
      ? "Resume Bot"
      : "Start Bot";

  return (
    <main className="min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={navItems}
        sessionLoading={sessionLoading}
        session={session}
        onLogout={handleLogout}
      />

      <AppHeader
        onMenuOpen={() => setMenuOpen(true)}
        onLogoClick={() => router.push("/")}
        sessionLoading={sessionLoading}
        session={session}
        onLogout={handleLogout}
      />

      <DevDisclaimer />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-8">
          <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-slate-900">
            <div className="border-b border-black/10 px-6 py-6 dark:border-white/10 sm:px-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />
                    <UtilityPill label={summary.tierName} />
                  </div>

                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
                    Launch Review
                  </p>

                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black dark:text-white sm:text-4xl">
                    Your bot is ready to review and start
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-black/60 dark:text-white/60 sm:text-base">
                    The purchase flow already captured the main launch configuration. This dashboard
                    is now focused on review, control, and monitoring. The bot will only begin once
                    you explicitly start it.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setSessionStatus((prev) =>
                        prev === "Running" ? "Running" : "Running"
                      )
                    }
                    disabled={sessionStatus === "Running"}
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
                  >
                    {primaryCtaLabel}
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSessionStatus("Paused")}
                      disabled={sessionStatus === "Paused" || sessionStatus === "Ready"}
                      className="rounded-2xl border border-black px-4 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      Pause
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionStatus("Stopped")}
                      disabled={sessionStatus === "Stopped" || sessionStatus === "Ready"}
                      className="rounded-2xl border border-black px-4 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-6 sm:px-7">
              <LaunchInfoCard label="Token" value={summary.tokenName} subvalue={summary.tokenAddressDisplay} />
              <LaunchInfoCard label="Wallets" value={String(summary.totalWallets)} subvalue="Configured at checkout" />
              <LaunchInfoCard label="Max / Wallet" value={summary.maxPerWallet} subvalue="Purchase configuration" />
              <LaunchInfoCard label="Potential Usage" value={summary.totalPotentialUsage} subvalue="Wallets × max balance" />
              <LaunchInfoCard label="Return Wallet" value={summary.returnWallet} subvalue="Unused SOL destination" />
              <LaunchInfoCard label="Daily Limit" value={formatSol(summary.dailyLimit)} subvalue="Configured session cap" />
            </div>
          </section>

          {pendingPurchase?.setupRequired && (
            <section className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                    Manual Start Flow
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black dark:text-white">
                    {pendingPurchase.tierName} purchased successfully
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65 dark:text-white/65">
                    Payment is complete and the configuration has been prepared for review. The bot
                    will not start automatically. Confirm the launch summary below and start when ready.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("pmpr_pending_purchase");
                    setPendingPurchase(null);
                  }}
                  className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  Dismiss Notice
                </button>
              </div>
            </section>
          )}

          <div
            id="overview"
            className="flex flex-wrap gap-3 rounded-[24px] border border-black/10 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900"
          >
            <OverviewPill label="Status" value={summary.cycleStatus} />
            <OverviewPill label="Tier" value={summary.tierName} />
            <OverviewPill label="Token" value={summary.tokenName} />
            <OverviewPill label="Address" value={summary.tokenAddressDisplay} />
            <OverviewPill label="Wallets" value={`${summary.activeWallets} / ${summary.totalWallets}`} />
            <OverviewPill label="Usage Today" value={`${summary.dailyUsed} / ${summary.dailyLimit} SOL`} />
            <OverviewPill label="Cycles" value={`${summary.completedCycles} / ${summary.maxCycles}`} />
          </div>

          <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-slate-900 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
                  Token Chart
                </h2>
                <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">
                  {summary.tokenAddress
                    ? `Tracking ${summary.tokenName} (${summary.tokenAddressDisplay}) for the currently prepared session.`
                    : "No token has been configured yet, so the live chart is not available."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                  {summary.geckoMode === "pools" ? "Solana pool" : "Solana token"}
                </span>
              </div>
            </div>

            {summary.tokenAddress ? (
              <GeckoTerminalChart
                mode={summary.geckoMode}
                address={summary.tokenAddress}
                height={560}
                chartType="price"
                resolution="15m"
                lightChart={theme === "light"}
                showInfo={false}
                showSwaps={false}
                bgColor={theme === "light" ? "ffffff" : "0b1120"}
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-black/15 px-6 text-center text-sm text-black/55 dark:border-white/15 dark:text-white/55">
                No Solana token configured yet. Once a token address is available from the purchase
                flow or local setup data, the chart will load here.
              </div>
            )}
          </section>

          <SectionCard
            id="controls"
            title="Launch Control Center"
            description="Review the submitted launch configuration, adjust operator behavior, and control the session state from one place."
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                        Launch Summary
                      </p>
                      <p className="mt-2 text-sm text-black/58 dark:text-white/58">
                        These are the primary values already chosen during purchase.
                      </p>
                    </div>

                    <StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReviewItem
                      label="Tier"
                      value={summary.tierName}
                      hint="Active subscription level"
                    />
                    <ReviewItem
                      label="Token"
                      value={summary.tokenName}
                      hint={summary.tokenAddressDisplay}
                    />
                    <ReviewItem
                      label="Wallet Count"
                      value={String(summary.totalWallets)}
                      hint="Configured at purchase"
                    />
                    <ReviewItem
                      label="Max Balance / Wallet"
                      value={summary.maxPerWallet}
                      hint="Per-wallet balance target"
                    />
                    <ReviewItem
                      label="Potential Usage"
                      value={summary.totalPotentialUsage}
                      hint="Maximum prepared deployment"
                    />
                    <ReviewItem
                      label="Return Wallet"
                      value={summary.returnWallet}
                      hint="Unused SOL destination"
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/10 bg-black text-white p-5 dark:border-white dark:bg-white dark:text-black">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/65 dark:text-black/60">
                    Session Actions
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    {sessionStatus === "Ready"
                      ? "Ready to launch"
                      : sessionStatus === "Running"
                      ? "Bot currently active"
                      : sessionStatus === "Paused"
                      ? "Session paused"
                      : "Session stopped"}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/72 dark:text-black/70">
                    Keep this section focused on control. The important launch choices have already been made.
                    This is where the operator decides when the bot actually runs.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSessionStatus("Running")}
                      disabled={sessionStatus === "Running"}
                      className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-black dark:text-white"
                    >
                      {sessionStatus === "Paused" ? "Resume Bot" : "Start Bot"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionStatus("Paused")}
                      disabled={sessionStatus === "Paused" || sessionStatus === "Ready"}
                      className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-black/20 dark:text-black dark:hover:bg-black dark:hover:text-white"
                    >
                      Pause Bot
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionStatus("Stopped")}
                      disabled={sessionStatus === "Stopped" || sessionStatus === "Ready"}
                      className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-black/20 dark:text-black dark:hover:bg-black dark:hover:text-white"
                    >
                      Stop Bot
                    </button>

                    <button
                      type="button"
                      onClick={handleResetCounters}
                      className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-black/20 dark:text-black/80 dark:hover:border-black dark:hover:text-black"
                    >
                      Reset Counters
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <RuntimeInfoPill label="Status" value={summary.cycleStatus} />
                    <RuntimeInfoPill label="Active Wallets" value={`${summary.activeWallets} / ${summary.totalWallets}`} />
                    <RuntimeInfoPill label="Remaining Today" value={`${summary.remainingToday} SOL`} />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                      Operator Settings
                    </p>
                    <p className="mt-2 text-sm text-black/58 dark:text-white/58">
                      Advanced runtime behavior that can still be tuned visually without changing the core purchase configuration.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <UtilityPill label={`Mode: ${summary.executionMode}`} />
                    <UtilityPill label={`Buy: ${summary.buyInterval}`} />
                    <UtilityPill label={`Sell: ${summary.sellInterval}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Execution Mode"
                    value={operatorConfig.executionMode}
                    onChange={(value) => updateOperatorConfig("executionMode", value)}
                    options={["Balanced", "Aggressive", "Conservative"]}
                    hint="Controls how actively the bot behaves once started."
                  />

                  <Field label="Max Cycles" hint="Soft visual limit for the current session.">
                    <InputWithSuffix
                      value={operatorConfig.maxCycles}
                      onChange={(value) => updateOperatorConfig("maxCycles", value)}
                      suffix="cycles"
                      placeholder="200"
                    />
                  </Field>

                  <SelectField
                    label="Buy Interval"
                    value={operatorConfig.buyInterval}
                    onChange={(value) => updateOperatorConfig("buyInterval", value)}
                    options={["5s", "10s", "15s", "30s", "60s"]}
                    hint="How frequently buy actions are attempted."
                  />

                  <SelectField
                    label="Sell Interval"
                    value={operatorConfig.sellInterval}
                    onChange={(value) => updateOperatorConfig("sellInterval", value)}
                    options={["5s", "10s", "15s", "30s", "60s"]}
                    hint="How frequently sell actions are attempted."
                  />

                  <SelectField
                    label="Slippage Tolerance"
                    value={operatorConfig.slippage}
                    onChange={(value) => updateOperatorConfig("slippage", value)}
                    options={["0.5%", "1%", "2%", "3%", "5%"]}
                    hint="Execution tolerance for volatile conditions."
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <ToggleButton
                    active={operatorConfig.randomizeAmounts}
                    label="Randomize Amounts"
                    onClick={() =>
                      updateOperatorConfig("randomizeAmounts", !operatorConfig.randomizeAmounts)
                    }
                  />
                  <ToggleButton
                    active={operatorConfig.autoStopOnLimit}
                    label="Auto-stop on Daily Limit"
                    onClick={() =>
                      updateOperatorConfig("autoStopOnLimit", !operatorConfig.autoStopOnLimit)
                    }
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveOperatorSettings}
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
                  >
                    Save Operator Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleResetOperatorSettings}
                    className="rounded-2xl border border-black/15 px-5 py-3 text-sm font-medium text-black/72 transition hover:border-black hover:text-black dark:border-white/15 dark:text-white/72 dark:hover:border-white dark:hover:text-white"
                  >
                    Reset Defaults
                  </button>
                </div>

                {operatorSaveMessage ? (
                  <p className="mt-4 text-sm text-black/60 dark:text-white/60">
                    {operatorSaveMessage}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                    Progress Monitoring
                  </p>
                  <p className="mt-2 text-sm text-black/58 dark:text-white/58">
                    Track cycle completion and daily usage once the session is active.
                  </p>
                </div>

                <div className="space-y-5">
                  <ProgressBlock
                    label="Cycle progress"
                    value={`${summary.completedCycles} / ${summary.maxCycles}`}
                    percent={cycleUsagePercent}
                  />
                  <ProgressBlock
                    label="Daily volume usage"
                    value={`${summary.dailyUsed} / ${summary.dailyLimit} SOL`}
                    percent={dailyUsagePercent}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Wallet Activity"
            description="Track participating wallets, execution health, and latest wallet actions."
            id="wallets"
          >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:w-auto">
                <MetricHighlightCard
                  label="Active Wallets"
                  value={String(summary.activeWallets)}
                  subvalue={`${summary.activeWallets} currently participating`}
                  tone="strong"
                />
                <MetricHighlightCard
                  label="Idle Wallets"
                  value={String(summary.idleWallets)}
                  subvalue="Awaiting next execution window"
                  tone="neutral"
                />
                <MetricHighlightCard
                  label="Failed Wallets"
                  value={String(summary.failedWallets)}
                  subvalue="Require review or retry"
                  tone="muted"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <UtilityPill label={`Loaded: ${summary.totalWallets}`} />
                <UtilityPill label={`Buy cycles: ${summary.buyCycles}`} />
                <UtilityPill label={`Sell cycles: ${summary.sellCycles}`} />
                <UtilityPill label={`Cycles left: ${summary.estimatedCyclesLeft}`} />
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {walletRows.map((wallet) => (
                <WalletActivityCard
                  key={wallet.address}
                  address={wallet.address}
                  status={wallet.status}
                  lastAction={wallet.lastAction}
                  lastTrade={wallet.lastTrade}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-[24px] border border-black/10 bg-white dark:border-white/10 dark:bg-slate-950 md:block">
              <div className="grid grid-cols-[1.35fr_0.9fr_1fr_0.7fr] border-b border-black/10 bg-black/[0.03] px-5 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-black/45 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                <span>Wallet</span>
                <span>Status</span>
                <span>Last Action</span>
                <span>Last Trade</span>
              </div>

              <div className="divide-y divide-black/10 dark:divide-white/10">
                {walletRows.map((wallet) => (
                  <div
                    key={wallet.address}
                    className="grid grid-cols-[1.35fr_0.9fr_1fr_0.7fr] items-center px-5 py-4 text-sm text-black/72 transition hover:bg-black/[0.02] dark:text-white/72 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-black dark:text-white">{wallet.address}</span>
                      <span className="mt-1 text-xs text-black/45 dark:text-white/45">
                        Solana execution wallet
                      </span>
                    </div>

                    <div>
                      <StatusBadge
                        label={wallet.status}
                        variant={
                          wallet.status === "Active"
                            ? "Active"
                            : wallet.status === "Idle"
                            ? "Idle"
                            : "Failed"
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="font-medium text-black dark:text-white">{wallet.lastAction}</span>
                      <span className="mt-1 text-xs text-black/45 dark:text-white/45">
                        Latest recorded event
                      </span>
                    </div>

                    <div className="text-sm font-medium text-black/65 dark:text-white/65">
                      {wallet.lastTrade}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}

type SectionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
  headerRight?: ReactNode;
};

function SectionCard({ title, description, children, id, headerRight }: SectionCardProps) {
  return (
    <section
      id={id}
      className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900 sm:p-7"
    >
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">
            {description}
          </p>
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      {children}
    </section>
  );
}

type LaunchInfoCardProps = {
  label: string;
  value: string;
  subvalue: string;
};

function LaunchInfoCard({ label, value, subvalue }: LaunchInfoCardProps) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-black dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-black/50 dark:text-white/50">{subvalue}</p>
    </div>
  );
}

type ReviewItemProps = {
  label: string;
  value: string;
  hint?: string;
};

function ReviewItem({ label, value, hint }: ReviewItemProps) {
  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-black dark:text-white">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-black/48 dark:text-white/48">{hint}</p>
      ) : null}
    </div>
  );
}

type MetricHighlightCardProps = {
  label: string;
  value: string;
  subvalue: string;
  tone: "strong" | "neutral" | "muted";
};

function MetricHighlightCard({
  label,
  value,
  subvalue,
  tone,
}: MetricHighlightCardProps) {
  const toneClassMap: Record<MetricHighlightCardProps["tone"], string> = {
    strong:
      "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white",
    neutral:
      "bg-white text-black border-black/10 dark:bg-slate-950 dark:text-white dark:border-white/10",
    muted:
      "bg-black/[0.02] text-black border-black/10 dark:bg-white/[0.03] dark:text-white dark:border-white/10",
  };

  const subduedTextClassMap: Record<MetricHighlightCardProps["tone"], string> = {
    strong: "text-white/70 dark:text-black/70",
    neutral: "text-black/55 dark:text-white/55",
    muted: "text-black/55 dark:text-white/55",
  };

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${toneClassMap[tone]}`}
    >
      <p className={`text-[11px] font-medium uppercase tracking-[0.18em] ${subduedTextClassMap[tone]}`}>
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-2 text-sm ${subduedTextClassMap[tone]}`}>{subvalue}</p>
    </div>
  );
}

type WalletActivityCardProps = {
  address: string;
  status: string;
  lastAction: string;
  lastTrade: string;
};

function WalletActivityCard({
  address,
  status,
  lastAction,
  lastTrade,
}: WalletActivityCardProps) {
  const resolvedVariant =
    status === "Active" ? "Active" : status === "Idle" ? "Idle" : "Failed";

  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Wallet
          </p>
          <p className="mt-2 text-base font-semibold text-black dark:text-white">{address}</p>
          <p className="mt-1 text-xs text-black/45 dark:text-white/45">
            Solana execution wallet
          </p>
        </div>

        <StatusBadge label={status} variant={resolvedVariant} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Last Action
          </p>
          <p className="mt-2 text-sm font-medium text-black dark:text-white">{lastAction}</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Last Trade
          </p>
          <p className="mt-2 text-sm font-medium text-black dark:text-white">{lastTrade}</p>
        </div>
      </div>
    </div>
  );
}

type ProgressBlockProps = {
  label: string;
  value: string;
  percent: number;
};

function ProgressBlock({ label, value, percent }: ProgressBlockProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-black dark:text-white">{label}</p>
        <p className="text-sm text-black/55 dark:text-white/55">{value}</p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-black transition-all dark:bg-white"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

function Field({ label, children, hint }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-black/48 dark:text-white/48">{hint}</p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  hint?: string;
};

function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 pr-12 text-sm font-medium text-black outline-none transition focus:border-black focus:bg-white dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-white dark:focus:bg-slate-950"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-black/40 dark:text-white/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </Field>
  );
}

type InputWithSuffixProps = {
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  placeholder?: string;
};

function InputWithSuffix({
  value,
  onChange,
  suffix,
  placeholder,
}: InputWithSuffixProps) {
  return (
    <div className="flex h-12 items-center rounded-2xl border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-slate-950">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-sm text-black outline-none dark:text-white"
      />
      <span className="ml-3 shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
        {suffix}
      </span>
    </div>
  );
}

type OverviewPillProps = {
  label: string;
  value: string;
};

function OverviewPill({ label, value }: OverviewPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </span>
      <span className="text-sm font-semibold text-black dark:text-white">{value}</span>
    </div>
  );
}

type RuntimeInfoPillProps = {
  label: string;
  value: string;
};

function RuntimeInfoPill({ label, value }: RuntimeInfoPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-4 py-2.5 dark:border-black/10 dark:bg-slate-950">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </span>
      <span className="text-sm font-semibold text-black dark:text-white">{value}</span>
    </div>
  );
}

type ToggleButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function ToggleButton({ active, label, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-black/15 bg-white text-black/72 hover:border-black hover:text-black dark:border-white/15 dark:bg-slate-950 dark:text-white/72 dark:hover:border-white dark:hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

type UtilityPillProps = {
  label: string;
};

function UtilityPill({ label }: UtilityPillProps) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black/72 dark:border-white/10 dark:bg-slate-950 dark:text-white/72">
      {label}
    </span>
  );
}

type StatusBadgeVariant =
  | "Ready"
  | "Running"
  | "Paused"
  | "Stopped"
  | "Success"
  | "Limited"
  | "Active"
  | "Idle"
  | "Failed"
  | "Within Limit"
  | "Limit Reached";

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
};

function StatusBadge({ label, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || "Idle";

  const styles: Record<StatusBadgeVariant, string> = {
    Ready:
      "border-black/15 bg-black/[0.06] text-black dark:border-white/10 dark:bg-white/10 dark:text-white",
    Running:
      "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
    Paused:
      "border-black/20 bg-black/[0.08] text-black dark:border-white/15 dark:bg-white/10 dark:text-white",
    Stopped:
      "border-black/10 bg-white text-black/70 dark:border-white/10 dark:bg-slate-900 dark:text-white/70",
    Success:
      "border-black bg-black/[0.9] text-white dark:border-white dark:bg-white dark:text-black",
    Limited:
      "border-black/15 bg-black/[0.06] text-black dark:border-white/10 dark:bg-white/10 dark:text-white",
    Active:
      "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
    Idle:
      "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75",
    Failed:
      "border-black/30 bg-black/[0.12] text-black dark:border-white/20 dark:bg-white/15 dark:text-white",
    "Within Limit":
      "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75",
    "Limit Reached":
      "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[resolvedVariant]}`}>
      {label}
    </span>
  );
}