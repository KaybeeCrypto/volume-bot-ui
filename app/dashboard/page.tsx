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
      <main className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-slate-950 dark:text-white">
        <p className="text-sm text-black/60 dark:text-white/60">Checking session...</p>
      </main>
    );
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Overview", href: "/dashboard#overview" },
    { label: "Control", href: "/dashboard#control" },
    { label: "Wallets", href: "/dashboard#wallets" },
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
          {pendingPurchase?.setupRequired && (
            <section className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
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
                  className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  Dismiss Notice
                </button>
              </div>
            </section>
          )}

          <section>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
              Live Session Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black dark:text-white sm:text-4xl">
              PMPR Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60 dark:text-white/60 sm:text-base">
              Monitor the current token session, wallet participation, buy and sell execution, and
              daily usage limits from one control panel.
            </p>
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

          

          <SectionCard
            id="control"
            title="Control Section"
            description="Current session status, token configuration, runtime controls, and progress tracking."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <InfoRow
                label="Current Session"
                value={<StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />}
              />
              <InfoRow label="Token Used in Session" value={summary.tokenName} />
              <InfoRow label="Token Address" value={summary.tokenAddressDisplay} />
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
                  <span className="font-medium text-black dark:text-white">{summary.tokenAddressDisplay}</span>
                </span>
              </div>

              {tokenLookupLoading && (
                <p className="mt-3 text-sm text-black/55 dark:text-white/55">Fetching token info...</p>
              )}

              {tokenLookupError && <p className="mt-3 text-sm text-red-600">{tokenLookupError}</p>}
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.04]">
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

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoRow label="Per Buy Rate" value={summary.perBuyRate} />
              <InfoRow label="Daily Limit" value={`${summary.dailyLimit} SOL`} />
              <InfoRow label="Buy Cycles" value={String(summary.buyCycles)} />
              <InfoRow label="Sell Cycles" value={String(summary.sellCycles)} />
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.025] p-5 dark:border-white/10 dark:bg-white/[0.04]">
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

            <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                Session note
              </p>
              <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                {getSessionHelperText()}
              </p>
            </div>
          </SectionCard>

          <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-slate-900 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
                    Token Chart
                  </h2>
                  <StatusBadge label={summary.cycleStatus} variant={summary.cycleStatus} />
                </div>
                <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">
                  {summary.tokenAddress
                    ? `Tracking ${summary.tokenName} (${summary.tokenAddressDisplay}) in the current session.`
                    : "Live GeckoTerminal chart for the active Solana token."}
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
              <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-black/15 text-center text-sm text-black/55 dark:border-white/15 dark:text-white/55">
                No Solana token configured yet. Enter a token address in the Control Section to load the chart.
              </div>
            )}
          </section>

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

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
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
        </div>
      </section>
    </main>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  subvalue: string;
};

function KpiCard({ label, value, subvalue }: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900">
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
      className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900 sm:p-7"
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
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
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
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
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
};

function StatusBadge({ label, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || "Idle";

  const styles: Record<StatusBadgeVariant, string> = {
    Running: "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
    Paused: "border-black/20 bg-black/[0.08] text-black dark:border-white/15 dark:bg-white/10 dark:text-white",
    Stopped: "border-black/10 bg-white text-black/70 dark:border-white/10 dark:bg-slate-900 dark:text-white/70",
    Success: "border-black bg-black/[0.9] text-white dark:border-white dark:bg-white dark:text-black",
    Limited: "border-black/15 bg-black/[0.06] text-black dark:border-white/10 dark:bg-white/10 dark:text-white",
    Active: "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
    Idle: "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75",
    Failed: "border-black/30 bg-black/[0.12] text-black dark:border-white/20 dark:bg-white/15 dark:text-white",
    "Within Limit": "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75",
    "Limit Reached": "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
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