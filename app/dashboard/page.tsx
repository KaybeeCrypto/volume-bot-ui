"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLogout } from "@/hooks/useLogout";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useRequireSession } from "@/hooks/useRequireSession";
import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import GeckoTerminalChart from "@/components/GeckoTerminalChart";
import { useWallet } from "@solana/wallet-adapter-react";

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

  const { handleLogout } = useLogout({
    disconnectWallet: async () => {
      try {
        await disconnect();
      } catch {
        // ignore disconnect errors
      }

      try {
        select(null);
      } catch {
        // ignore adapter reset errors
      }

      try {
        localStorage.removeItem("walletName");
      } catch {
        // ignore storage errors
      }
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

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <p className="text-sm text-black/60">Checking session...</p>
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
    <main className="min-h-screen bg-white text-black">
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

      {pendingPurchase?.setupRequired && (
        <section className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Setup Required
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {pendingPurchase.tierName} purchased
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">
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
              className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white"
            >
              Dismiss Notice
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-black/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-black/55">
                Live session overview
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">PMPR Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60 sm:text-base">
                Monitor current token session, wallet participation, buy and sell cycle flow, and daily usage limits from one control panel.
              </p>
            </div>
          </div>

          <div id="overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="Token in Session" value={summary.tokenName} subvalue={summary.tokenAddressDisplay} />
            <KpiCard label="Buy / Sell Cycles" value={String(summary.completedCycles)} subvalue={summary.cycleStatus} />
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
            title="Token Chart"
            description="Live GeckoTerminal chart for the active Solana token."
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-black">Active chart</p>
                <p className="mt-1 text-sm text-black/55">
                  Monitor token price action without leaving the dashboard.
                </p>
              </div>

              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/75">
                {summary.geckoMode === "pools" ? "Solana pool" : "Solana token"}
              </span>
            </div>

            {summary.tokenAddress ? (
              <GeckoTerminalChart
                mode={summary.geckoMode}
                address={summary.tokenAddress}
                height={560}
                chartType="price"
                resolution="15m"
                lightChart={true}
                showInfo={false}
                showSwaps={false}
                bgColor="ffffff"
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-black/15 text-sm text-black/55">
                No Solana token configured yet.
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard
              id="controls"
              title="Session / Bot Config"
              description="Core runtime settings for the active token session."
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={tokenAddressInput}
                  onChange={(e) => setTokenAddressInput(e.target.value)}
                  placeholder="Enter Solana token address"
                  className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveToken}
                    disabled={tokenLookupLoading}
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tokenLookupLoading ? "Saving..." : "Save Token"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearToken}
                    className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {tokenLookupLoading && (
                <p className="mb-4 text-sm text-black/55">Fetching token info...</p>
              )}

              {tokenLookupError && (
                <p className="mb-4 text-sm text-red-600">{tokenLookupError}</p>
              )}

              <div className="mb-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  Session controls
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Running")}
                    className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Start Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Paused")}
                    className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionStatus("Stopped")}
                    className="rounded-2xl border border-black/15 px-5 py-3 text-sm font-medium text-black/70 transition hover:border-black hover:text-black"
                  >
                    Stop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Token Used in Session" value={summary.tokenName} />
                <InfoRow label="Token Address" value={summary.tokenAddressDisplay} />
                <InfoRow label="Session Status" value={summary.cycleStatus} />
                <InfoRow label="Per Buy Rate" value={summary.perBuyRate} />
                <InfoRow label="Daily Limit" value={`${summary.dailyLimit} SOL`} />
                <InfoRow label="Max Cycles" value={String(summary.maxCycles)} />
              </div>

              <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.025] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">Session note</p>
                <p className="mt-2 text-sm leading-6 text-black/65">
                  This panel is set up as the visual home for your active Solana volume bot session. Later you can replace these display rows with editable inputs tied to backend config values.
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

              <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
                <div className="grid grid-cols-4 border-b border-black/10 bg-black/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-black/45">
                  <span>Wallet</span>
                  <span>Status</span>
                  <span>Last Action</span>
                  <span>Last Trade</span>
                </div>
                <div className="divide-y divide-black/10">
                  {walletRows.map((wallet) => (
                    <div key={wallet.address} className="grid grid-cols-4 px-4 py-3 text-sm text-black/75">
                      <span className="font-medium text-black">{wallet.address}</span>
                      <span>
                        <StatusBadge label={wallet.status} />
                      </span>
                      <span>{wallet.lastAction}</span>
                      <span>{wallet.lastTrade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cycle Controls" description="Monitor progress across buy and sell execution loops.">
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
                <button className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
                  Start New Cycle Batch
                </button>
                <button className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white">
                  Pause Execution
                </button>
                <button className="rounded-2xl border border-black/15 px-5 py-3 text-sm font-medium text-black/70 transition hover:border-black hover:text-black">
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

              <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.025] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Usage condition</p>
                    <p className="mt-1 text-sm text-black/55">The dashboard keeps the most important throughput numbers visible at all times.</p>
                  </div>
                  <StatusBadge label={summary.dailyUsed >= summary.dailyLimit ? "Limit Reached" : "Within Limit"} />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard id="activity" title="Recent Activity" description="Latest actions executed by the bot across active wallets.">
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-black/[0.03] text-xs uppercase tracking-[0.16em] text-black/45">
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
                    <tr key={`${item.wallet}-${index}`} className="text-sm text-black/75">
                      <td className="border-t border-black/10 px-4 py-4">{item.time}</td>
                      <td className="border-t border-black/10 px-4 py-4 font-medium text-black">{item.wallet}</td>
                      <td className="border-t border-black/10 px-4 py-4">{item.action}</td>
                      <td className="border-t border-black/10 px-4 py-4">{item.amount}</td>
                      <td className="border-t border-black/10 px-4 py-4">{item.token}</td>
                      <td className="border-t border-black/10 px-4 py-4">
                        <StatusBadge label={item.status} />
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

type KpiCardProps = {
  label: string;
  value: string;
  subvalue: string;
};

function KpiCard({ label, value, subvalue }: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-black">{value}</p>
      <p className="mt-2 text-sm text-black/55">{subvalue}</p>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  id?: string;
};

function SectionCard({ title, description, children, id }: SectionCardProps) {
  return (
    <section
      id={id}
      className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:p-7"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-black">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-black/58">{description}</p>
      </div>
      {children}
    </section>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">{label}</p>
      <p className="mt-3 text-base font-semibold text-black">{value}</p>
    </div>
  );
}

type MiniMetricProps = {
  label: string;
  value: string;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/45">{label}</p>
      <p className="mt-3 text-xl font-semibold text-black">{value}</p>
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
        <p className="text-sm font-medium text-black">{label}</p>
        <p className="text-sm text-black/55">{value}</p>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/8">
        <div className="h-full rounded-full bg-black transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

type StatusBadgeProps = {
  label: string;
};

function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/75">
      {label}
    </span>
  );
}