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

type DashboardSummary = {
  tokenName: string;
  tokenAddress: string;
  tokenAddressDisplay: string;
  geckoMode: "tokens" | "pools";
  completedCycles: number;
  cycleStatus: "Running" | "Paused" | "Stopped";
  perBuyRate: string;
  dailyUsed: number;
  dailyLimit: number;
  activeWallets: number;
  totalWallets: number;
  buyCycles: number;
  sellCycles: number;
  maxCycles: number;
  idleWallets: number;
  failedWallets: number;
  remainingToday: number;
  estimatedCyclesLeft: number;
};

export default function VolumeBotDashboardPage() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<"Running" | "Paused" | "Stopped">("Running");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tokenAddressInput, setTokenAddressInput] = useState("");
  const [configuredTokenAddress, setConfiguredTokenAddress] = useState("");
  const [configuredTokenTicker, setConfiguredTokenTicker] = useState("");
  const [tokenLookupLoading, setTokenLookupLoading] = useState(false);
  const [tokenLookupError, setTokenLookupError] = useState("");
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

      if (savedAddress) {
        setConfiguredTokenAddress(savedAddress);
        setTokenAddressInput(savedAddress);
      }

      if (savedTicker) {
        setConfiguredTokenTicker(savedTicker);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useBodyScrollLock(menuOpen);
  useRequireSession(sessionLoading, session);

  const summary = useMemo<DashboardSummary>(
    () => ({
      tokenName: configuredTokenTicker || "Not configured",
      tokenAddress: configuredTokenAddress,
      tokenAddressDisplay: configuredTokenAddress
        ? `${configuredTokenAddress.slice(0, 4)}...${configuredTokenAddress.slice(-4)}`
        : "Not configured",
      geckoMode: "tokens",
      completedCycles: 128,
      cycleStatus: sessionStatus,
      perBuyRate: "0.15 SOL",
      dailyUsed: 12,
      dailyLimit: 20,
      activeWallets: 18,
      totalWallets: 24,
      buyCycles: 64,
      sellCycles: 64,
      maxCycles: 200,
      idleWallets: 4,
      failedWallets: 2,
      remainingToday: 8,
      estimatedCyclesLeft: 53,
    }),
    [sessionStatus, configuredTokenAddress, configuredTokenTicker]
  );

  const [pendingPurchase, setPendingPurchase] = useState<null | {
    tierKey: string;
    tierName: string;
    priceSol: string;
    purchasedAt: number;
    setupRequired: boolean;
  }>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pmpr_pending_purchase");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setPendingPurchase(parsed);
    } catch {
      setPendingPurchase(null);
    }
  }, []);

  async function fetchTokenTicker(address: string) {
    const trimmed = address.trim();
    if (!trimmed) {
      throw new Error("Token address is required.");
    }

    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${trimmed}/info`,
      {
        headers: {
          Accept: "application/json;version=20230302",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Token lookup failed.");
    }

    const json = await response.json();

    const symbol = json?.data?.attributes?.symbol || json?.data?.attributes?.name || "";

    if (!symbol) {
      throw new Error("Token ticker not found.");
    }

    return symbol;
  }

  async function handleSaveToken() {
    const nextAddress = tokenAddressInput.trim();
    if (!nextAddress) {
      setTokenLookupError("Token address is required.");
      return;
    }

    setTokenLookupLoading(true);
    setTokenLookupError("");

    try {
      const ticker = await fetchTokenTicker(nextAddress);

      setConfiguredTokenAddress(nextAddress);
      setConfiguredTokenTicker(ticker);

      localStorage.setItem("pmpr_chart_token_address", nextAddress);
      localStorage.setItem("pmpr_chart_token_ticker", ticker);
    } catch (error) {
      setTokenLookupError(
        error instanceof Error ? error.message : "Could not fetch token ticker."
      );
    } finally {
      setTokenLookupLoading(false);
    }
  }

  function handleClearToken() {
    setConfiguredTokenAddress("");
    setConfiguredTokenTicker("");
    setTokenAddressInput("");
    setTokenLookupError("");

    try {
      localStorage.removeItem("pmpr_chart_token_address");
      localStorage.removeItem("pmpr_chart_token_ticker");
    } catch {
      // ignore storage errors
    }
  }

  function getSessionHelperText() {
    if (!summary.tokenAddress) {
      return "Enter a Solana token address to configure the session and load the chart.";
    }

    if (summary.cycleStatus === "Running") {
      return `Session is live for ${summary.tokenName}. Monitor wallet flow and volume usage below.`;
    }

    if (summary.cycleStatus === "Paused") {
      return `Session is paused for ${summary.tokenName}. Resume when you want execution to continue.`;
    }

    return `Session is configured for ${summary.tokenName} and ready to start.`;
  }

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_35%),#ffffff] text-black dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_30%),#020617] dark:text-white">
        <p className="text-sm text-black/60 dark:text-white/60">Checking session...</p>
      </main>
    );
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Overview", href: "/dashboard#overview" },
    { label: "Controls", href: "/dashboard#controls" },
    { label: "Wallets", href: "/dashboard#wallets" },
    { label: "Activity", href: "/dashboard#activity" },
  ];

  const quickLinks = [
    { label: "Overview", href: "#overview" },
    { label: "Controls", href: "#controls" },
    { label: "Wallets", href: "#wallets" },
    { label: "Activity", href: "#activity" },
  ];

  const recentActivity = [
    {
      time: "14:32:08",
      wallet: "4rYd...8Pw2",
      action: "Buy executed",
      amount: "0.15 SOL",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Success",
    },
    {
      time: "14:31:42",
      wallet: "8LaP...2Mn9",
      action: "Sell executed",
      amount: "0.14 SOL",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Success",
    },
    {
      time: "14:30:51",
      wallet: "3KfQ...7Hs1",
      action: "Cycle completed",
      amount: "--",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Success",
    },
    {
      time: "14:29:10",
      wallet: "9RtM...5Qa4",
      action: "Wallet skipped",
      amount: "--",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Limited",
    },
    {
      time: "14:27:36",
      wallet: "2VnB...1Je8",
      action: "Buy executed",
      amount: "0.15 SOL",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Success",
    },
    {
      time: "14:25:03",
      wallet: "6ZkD...4Pw7",
      action: "Sell executed",
      amount: "0.15 SOL",
      token: summary.tokenName !== "Not configured" ? summary.tokenName : "--",
      status: "Success",
    },
  ];

  const walletRows = [
    { address: "4rYd...8Pw2", status: "Active", lastAction: "Buy", lastTrade: "14:32" },
    { address: "8LaP...2Mn9", status: "Active", lastAction: "Sell", lastTrade: "14:31" },
    { address: "3KfQ...7Hs1", status: "Idle", lastAction: "Waiting", lastTrade: "14:30" },
    { address: "9RtM...5Qa4", status: "Failed", lastAction: "Skipped", lastTrade: "14:29" },
    { address: "2VnB...1Je8", status: "Active", lastAction: "Buy", lastTrade: "14:27" },
  ];

  const dailyUsagePercent = Math.min((summary.dailyUsed / summary.dailyLimit) * 100, 100);
  const cycleUsagePercent = Math.min((summary.completedCycles / summary.maxCycles) * 100, 100);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_30%),#f8fafc] text-black dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_25%),#020617] dark:text-white">
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

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-6 lg:gap-8">
          {pendingPurchase?.setupRequired && (
            <section className="rounded-[30px] border border-cyan-200/80 bg-cyan-50/90 p-5 shadow-[0_14px_40px_rgba(8,145,178,0.10)] backdrop-blur-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                    Setup Required
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black dark:text-white">
                    {pendingPurchase.tierName} purchased
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65 dark:text-white/65">
                    Payment has been marked as complete for the {pendingPurchase.tierName} tier.
                    Configure the bot first. The session will not start automatically.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("pmpr_pending_purchase");
                    setPendingPurchase(null);
                  }}
                  className="rounded-2xl border border-black/15 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white/15 dark:bg-slate-950 dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  Dismiss Notice
                </button>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="rounded-[34px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/85 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <p className="inline-flex w-fit rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
                    Live session overview
                  </p>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white sm:text-4xl lg:text-[2.6rem]">
                      PMPR Dashboard
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-black/62 dark:text-white/62 sm:text-base">
                      Monitor the current token session, wallet participation, buy and sell execution,
                      and daily usage limits from one clean control center.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {quickLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/75 transition hover:border-black/20 hover:bg-black/[0.03] hover:text-black dark:border-white/10 dark:bg-slate-950 dark:text-white/75 dark:hover:border-white/20 dark:hover:bg-white/[0.05] dark:hover:text-white"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-[28px] border border-black/10 bg-black/[0.02] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2 2xl:grid-cols-4">
                  <TopSummaryPill
                    label="Session"
                    value={<StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />}
                  />
                  <TopSummaryPill label="Current Token" value={summary.tokenName} />
                  <TopSummaryPill
                    label="Active Wallets"
                    value={`${summary.activeWallets} / ${summary.totalWallets}`}
                  />
                  <TopSummaryPill label="Remaining Today" value={`${summary.remainingToday} SOL`} />
                </div>
              </div>
            </div>

            <section className="rounded-[34px] border border-black/10 bg-black p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-white dark:text-black sm:p-7">
              <div className="flex h-full flex-col gap-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55 dark:text-black/55">
                    Session control center
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight">Current session</h2>
                    <StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} inverted />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/70 dark:text-black/70">
                    {getSessionHelperText()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InvertedStatCard label="Token" value={summary.tokenName} />
                  <InvertedStatCard label="Buy Rate" value={summary.perBuyRate} />
                  <InvertedStatCard label="Cycles" value={`${summary.completedCycles}/${summary.maxCycles}`} />
                  <InvertedStatCard label="Usage" value={`${summary.dailyUsed}/${summary.dailyLimit} SOL`} />
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Running")}
                    disabled={sessionStatus === "Running"}
                    className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-black dark:text-white"
                  >
                    Start Bot
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSessionStatus("Paused")}
                      disabled={sessionStatus === "Paused"}
                      className="rounded-2xl border border-white/20 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:border-black/20 dark:text-black dark:hover:bg-black dark:hover:text-white"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionStatus("Stopped")}
                      disabled={sessionStatus === "Stopped"}
                      className="rounded-2xl border border-white/14 px-5 py-3.5 text-sm font-medium text-white/82 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-black/15 dark:text-black/80 dark:hover:border-black dark:hover:text-black"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                <div className="mt-auto rounded-2xl border border-white/12 bg-white/8 p-4 dark:border-black/10 dark:bg-black/5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55 dark:text-black/55">
                    Active token
                  </p>
                  <p className="mt-2 text-base font-semibold">{summary.tokenName}</p>
                  <p className="mt-1 text-sm text-white/65 dark:text-black/65">
                    {summary.tokenAddressDisplay}
                  </p>
                </div>
              </div>
            </section>
          </section>

          <div id="overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Token in Session"
              value={summary.tokenName}
              subvalue={summary.tokenAddressDisplay}
            />
            <KpiCard
              label="Completed Cycles"
              value={String(summary.completedCycles)}
              subvalue={summary.cycleStatus}
            />
            <KpiCard label="Per Buy Rate" value={summary.perBuyRate} subvalue="Current execution size" />
            <KpiCard
              label="Daily Limit"
              value={`${summary.dailyUsed} / ${summary.dailyLimit} SOL`}
              subvalue={`${Math.round(dailyUsagePercent)}% used today`}
            />
            <KpiCard
              label="Active Wallets"
              value={String(summary.activeWallets)}
              subvalue={`${summary.totalWallets} wallets loaded`}
            />
          </div>

          <section className="rounded-[34px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/90 sm:p-6 lg:p-7">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
                    Token Chart
                  </h2>
                  <StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58 dark:text-white/58">
                  {summary.tokenAddress
                    ? `Tracking ${summary.tokenName} (${summary.tokenAddressDisplay}) in the current session.`
                    : "Live GeckoTerminal chart for the active Solana token."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-medium text-black/72 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72">
                  {summary.geckoMode === "pools" ? "Solana pool" : "Solana token"}
                </span>
              </div>
            </div>

            {summary.tokenAddress ? (
              <div className="overflow-hidden rounded-[26px] border border-black/10 bg-white dark:border-white/10 dark:bg-slate-950">
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
              </div>
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-[26px] border border-dashed border-black/15 bg-black/[0.02] px-6 text-center text-sm text-black/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
                No Solana token configured yet. Enter a token address in Session / Bot Config to load the chart.
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard
              id="controls"
              title="Session / Bot Config"
              description="Core runtime settings for the active token session."
            >
              <div className="mb-6 rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                  Token configuration
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={tokenAddressInput}
                    onChange={(e) => setTokenAddressInput(e.target.value)}
                    placeholder="Enter Solana token address"
                    className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-white"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveToken}
                      disabled={tokenLookupLoading}
                      className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
                    >
                      {tokenLookupLoading ? "Saving..." : "Save Token"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-black/60 dark:text-white/60">
                  <span>
                    Current token:{" "}
                    <span className="font-medium text-black dark:text-white">{summary.tokenName}</span>
                  </span>
                  <span>
                    Address:{" "}
                    <span className="font-medium text-black dark:text-white">
                      {summary.tokenAddressDisplay}
                    </span>
                  </span>
                </div>

                {tokenLookupLoading && (
                  <p className="mt-3 text-sm text-black/55 dark:text-white/55">Fetching token info...</p>
                )}

                {tokenLookupError && <p className="mt-3 text-sm text-red-600">{tokenLookupError}</p>}
              </div>

              <div className="mb-6 rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                  Session controls
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Running")}
                    disabled={sessionStatus === "Running"}
                    className={getSessionControlButtonClass(sessionStatus === "Running", "primary")}
                  >
                    Start Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Paused")}
                    disabled={sessionStatus === "Paused"}
                    className={getSessionControlButtonClass(sessionStatus === "Paused", "secondary")}
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Stopped")}
                    disabled={sessionStatus === "Stopped"}
                    className={getSessionControlButtonClass(sessionStatus === "Stopped", "muted")}
                  >
                    Stop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Token Used in Session" value={summary.tokenName} />
                <InfoRow label="Token Address" value={summary.tokenAddressDisplay} />
                <InfoRow
                  label="Session Status"
                  value={<StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />}
                />
                <InfoRow label="Per Buy Rate" value={summary.perBuyRate} />
                <InfoRow label="Daily Limit" value={`${summary.dailyLimit} SOL`} />
                <InfoRow label="Max Cycles" value={String(summary.maxCycles)} />
              </div>

              <div className="mt-6 rounded-[24px] border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                  Session note
                </p>
                <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                  {getSessionHelperText()}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Wallet Activity"
              description="Track participating wallets and their most recent actions."
              id="wallets"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniMetric label="Active" value={String(summary.activeWallets)} />
                <MiniMetric label="Idle" value={String(summary.idleWallets)} />
                <MiniMetric label="Failed" value={String(summary.failedWallets)} />
              </div>

              <div className="mt-6 overflow-hidden rounded-[24px] border border-black/10 dark:border-white/10">
                <div className="grid grid-cols-4 border-b border-black/10 bg-black/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                  <span>Wallet</span>
                  <span>Status</span>
                  <span>Last Action</span>
                  <span>Last Trade</span>
                </div>
                <div className="divide-y divide-black/10 dark:divide-white/10">
                  {walletRows.map((wallet) => (
                    <div
                      key={wallet.address}
                      className="grid grid-cols-4 px-4 py-3 text-sm text-black/75 transition hover:bg-black/[0.02] dark:text-white/75 dark:hover:bg-white/[0.03]"
                    >
                      <span className="font-medium text-black dark:text-white">{wallet.address}</span>
                      <span>
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
                      </span>
                      <span className="font-medium text-black dark:text-white">{wallet.lastAction}</span>
                      <span>{wallet.lastTrade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Cycle Controls"
              description="Monitor progress across buy and sell execution loops."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Buy Cycles" value={String(summary.buyCycles)} />
                <InfoRow label="Sell Cycles" value={String(summary.sellCycles)} />
                <InfoRow label="Completed Cycles" value={String(summary.completedCycles)} />
                <InfoRow label="Max Cycles" value={String(summary.maxCycles)} />
              </div>

              <div className="mt-6 space-y-5">
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

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black">
                  Start New Cycle Batch
                </button>
                <button className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black">
                  Pause Execution
                </button>
                <button className="rounded-2xl border border-black/15 px-5 py-3 text-sm font-medium text-black/70 transition hover:border-black hover:text-black dark:border-white/15 dark:text-white/70 dark:hover:border-white dark:hover:text-white">
                  Reset Counters
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Limits & Usage" description="Daily cap and remaining execution headroom.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Daily Cap" value={`${summary.dailyLimit} SOL`} />
                <InfoRow label="Used Today" value={`${summary.dailyUsed} SOL`} />
                <InfoRow label="Remaining Today" value={`${summary.remainingToday} SOL`} />
                <InfoRow label="Estimated Cycles Left" value={String(summary.estimatedCyclesLeft)} />
              </div>

              <div className="mt-6 rounded-[24px] border border-black/10 bg-black/[0.025] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-white">Usage condition</p>
                    <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                      The dashboard keeps the most important throughput numbers visible at all times.
                    </p>
                  </div>
                  <StatusBadge
                    label={summary.dailyUsed >= summary.dailyLimit ? "Limit Reached" : "Within Limit"}
                    variant={summary.dailyUsed >= summary.dailyLimit ? "Limit Reached" : "Within Limit"}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            id="activity"
            title="Recent Activity"
            description="Latest actions executed by the bot across active wallets."
          >
            <div className="overflow-x-auto rounded-[24px] border border-black/10 dark:border-white/10">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-black/[0.03] text-xs uppercase tracking-[0.16em] text-black/45 dark:bg-white/[0.04] dark:text-white/45">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Wallet</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Token</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item, index) => (
                    <tr
                      key={`${item.wallet}-${index}`}
                      className={`text-sm text-black/75 transition hover:bg-black/[0.02] dark:text-white/75 dark:hover:bg-white/[0.03] ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-black/[0.01] dark:bg-white/[0.02]"
                      }`}
                    >
                      <td className="border-t border-black/10 px-4 py-4 dark:border-white/10">
                        {item.time}
                      </td>
                      <td className="border-t border-black/10 px-4 py-4 font-medium text-black dark:border-white/10 dark:text-white">
                        {item.wallet}
                      </td>
                      <td className="border-t border-black/10 px-4 py-4 font-medium text-black dark:border-white/10 dark:text-white">
                        {item.action}
                      </td>
                      <td className="border-t border-black/10 px-4 py-4 dark:border-white/10">
                        {item.amount}
                      </td>
                      <td className="border-t border-black/10 px-4 py-4 dark:border-white/10">
                        {item.token}
                      </td>
                      <td className="border-t border-black/10 px-4 py-4 dark:border-white/10">
                        <StatusBadge
                          label={item.status}
                          variant={item.status === "Limited" ? "Limited" : "Success"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}

type TopSummaryPillProps = {
  label: string;
  value: ReactNode;
};

function TopSummaryPill({ label, value }: TopSummaryPillProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-slate-950">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold text-black dark:text-white">{value}</div>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  subvalue: string;
};

function KpiCard({ label, value, subvalue }: KpiCardProps) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/90">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-black dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-black/55 dark:text-white/55">{subvalue}</p>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
};

function SectionCard({ title, description, children, id }: SectionCardProps) {
  return (
    <section
      id={id}
      className="rounded-[30px] border border-black/10 bg-white/90 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/90 sm:p-7"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">{description}</p>
      </div>
      {children}
    </section>
  );
}

type InfoRowProps = {
  label: string;
  value: ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <div className="mt-3 text-base font-semibold text-black dark:text-white">{value}</div>
    </div>
  );
}

type MiniMetricProps = {
  label: string;
  value: string;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <p className="mt-3 text-xl font-semibold text-black dark:text-white">{value}</p>
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
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-black transition-all dark:bg-white"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

type InvertedStatCardProps = {
  label: string;
  value: string;
};

function InvertedStatCard({ label, value }: InvertedStatCardProps) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4 dark:border-black/10 dark:bg-black/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/50 dark:text-black/50">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white dark:text-black">{value}</p>
    </div>
  );
}

type StatusBadgeVariant =
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
  inverted?: boolean;
};

function StatusBadge({ label, variant, inverted = false }: StatusBadgeProps) {
  const resolvedVariant = variant || "Idle";

  const styles: Record<StatusBadgeVariant, string> = inverted
    ? {
        Running: "border-white/15 bg-white text-black dark:border-black/15 dark:bg-black dark:text-white",
        Paused:
          "border-white/20 bg-white/12 text-white dark:border-black/20 dark:bg-black/10 dark:text-black",
        Stopped:
          "border-white/15 bg-transparent text-white/75 dark:border-black/15 dark:bg-transparent dark:text-black/75",
        Success: "border-white/15 bg-white text-black dark:border-black/15 dark:bg-black dark:text-white",
        Limited:
          "border-white/15 bg-white/10 text-white dark:border-black/15 dark:bg-black/10 dark:text-black",
        Active: "border-white/15 bg-white text-black dark:border-black/15 dark:bg-black dark:text-white",
        Idle:
          "border-white/15 bg-white/10 text-white/80 dark:border-black/15 dark:bg-black/10 dark:text-black/80",
        Failed:
          "border-white/15 bg-white/14 text-white dark:border-black/15 dark:bg-black/15 dark:text-black",
        "Within Limit":
          "border-white/15 bg-white/10 text-white/80 dark:border-black/15 dark:bg-black/10 dark:text-black/80",
        "Limit Reached":
          "border-white/15 bg-white text-black dark:border-black/15 dark:bg-black dark:text-white",
      }
    : {
        Running: "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
        Paused:
          "border-black/20 bg-black/[0.08] text-black dark:border-white/15 dark:bg-white/10 dark:text-white",
        Stopped:
          "border-black/10 bg-white text-black/70 dark:border-white/10 dark:bg-slate-900 dark:text-white/70",
        Success: "border-black bg-black/[0.9] text-white dark:border-white dark:bg-white dark:text-black",
        Limited:
          "border-black/15 bg-black/[0.06] text-black dark:border-white/10 dark:bg-white/10 dark:text-white",
        Active: "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
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

function getSessionControlButtonClass(isActive: boolean, tone: "primary" | "secondary" | "muted") {
  if (isActive) {
    return "cursor-not-allowed rounded-2xl border border-black bg-black px-5 py-3 text-sm font-medium text-white opacity-70 dark:border-white dark:bg-white dark:text-black";
  }

  if (tone === "primary") {
    return "rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black";
  }

  if (tone === "secondary") {
    return "rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black";
  }

  return "rounded-2xl border border-black/15 px-5 py-3 text-sm font-medium text-black/70 transition hover:border-black hover:text-black dark:border-white/15 dark:text-white/70 dark:hover:border-white dark:hover:text-white";
}