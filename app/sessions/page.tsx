"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import AppHeader from "@/components/AppHeader";
import DevDisclaimer from "@/components/DevDisclaimer";
import SideMenu from "@/components/SideMenu";

import { useAuthSession } from "@/hooks/useAuthSession";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useLogout } from "@/hooks/useLogout";
import { useRequireSession } from "@/hooks/useRequireSession";

import type { Session, SessionStatus } from "@/types/session";

const MOCK_SESSIONS: Session[] = [
  {
    id: "VS_240981",
    tierKey: "standard",
    tierName: "Standard",
    tokenAddress: "7xKp9dL3mN4Q2rS8vY6eW1zA5bC7dF9hJ2kLmN8pQrT",
    tokenName: "BOTHEAD",
    tokenSymbol: "BOT",
    walletCount: 30,
    solPerWallet: 0.15,
    returnWallet: "9PqfE7rLm2vX8aT1nC4dH6yK3zQwR5mU7bJ9sD2fGhL",
    paymentAddress: "4ABcY8dL2mN9pQ3rS6tV1wX5yZ7kL0cF8hJ2mN6pQrS",
    paymentAmountSol: 3,
    paymentExpiresAt: "2026-04-08T18:00:00.000Z",
    createdAt: "2026-04-08T14:15:00.000Z",
    startedAt: "2026-04-08T14:22:00.000Z",
    endsAt: "2026-04-09T14:22:00.000Z",
    status: "running",
    crashCount: 0,
    restartCount: 1,
  },
  {
    id: "VS_240982",
    tierKey: "basic",
    tierName: "Basic",
    tokenAddress: "3NpQ7dF5hJ2kLmN8pQrT7xKp9dL3mN4Q2rS8vY6eW1zA",
    tokenName: "WAVE",
    tokenSymbol: "WAVE",
    walletCount: 10,
    solPerWallet: 0.1,
    returnWallet: "5GhL9PqfE7rLm2vX8aT1nC4dH6yK3zQwR5mU7bJ9sD2f",
    paymentAddress: "6JkT4ABcY8dL2mN9pQ3rS6tV1wX5yZ7kL0cF8hJ2mN6p",
    paymentAmountSol: 1.5,
    paymentExpiresAt: "2026-04-08T19:30:00.000Z",
    createdAt: "2026-04-08T16:30:00.000Z",
    status: "awaiting_payment",
    crashCount: 0,
    restartCount: 0,
  },
  {
    id: "VS_240983",
    tierKey: "pro",
    tierName: "Pro",
    tokenAddress: "8vY6eW1zA5bC7dF9hJ2kLmN8pQrT7xKp9dL3mN4Q2rS",
    tokenName: "NOVA",
    tokenSymbol: "NOVA",
    walletCount: 50,
    solPerWallet: 0.12,
    returnWallet: "2rS8vY6eW1zA5bC7dF9hJ2kLmN8pQrT7xKp9dL3mN4Q",
    paymentAddress: "1wX5yZ7kL0cF8hJ2mN6p4ABcY8dL2mN9pQ3rS6tV",
    paymentAmountSol: 5,
    paymentExpiresAt: "2026-04-08T17:00:00.000Z",
    createdAt: "2026-04-08T13:00:00.000Z",
    status: "ready_to_start",
    crashCount: 0,
    restartCount: 0,
  },
  {
    id: "VS_240984",
    tierKey: "standard",
    tierName: "Standard",
    tokenAddress: "9RtM5Qa43NpQ7dF5hJ2kLmN8pQrT7xKp9dL3mN4Q2rS",
    tokenName: "ECHO",
    tokenSymbol: "ECHO",
    walletCount: 30,
    solPerWallet: 0.11,
    returnWallet: "7dF9hJ2kLmN8pQrT7xKp9dL3mN4Q2rS8vY6eW1zA5bC",
    paymentAmountSol: 3,
    createdAt: "2026-04-08T09:00:00.000Z",
    status: "failed",
    crashCount: 3,
    restartCount: 3,
  },
  {
    id: "VS_240970",
    tierKey: "standard",
    tierName: "Standard",
    tokenAddress: "6tV1wX5yZ7kL0cF8hJ2mN6pQrS7xKp9dL3mN4Q2rS8vY",
    tokenName: "PULSE",
    tokenSymbol: "PLS",
    walletCount: 30,
    solPerWallet: 0.14,
    returnWallet: "7dF9hJ2kLmN8pQrT7xKp9dL3mN4Q2rS8vY6eW1zA5bC",
    createdAt: "2026-04-07T08:00:00.000Z",
    startedAt: "2026-04-07T08:20:00.000Z",
    endsAt: "2026-04-08T08:20:00.000Z",
    status: "completed",
    crashCount: 1,
    restartCount: 1,
    returnedSolAmount: 1.82,
  },
  {
    id: "VS_240969",
    tierKey: "basic",
    tierName: "Basic",
    tokenAddress: "4LmN2Qa89RtM5Qa43NpQ7dF5hJ2kLmN8pQrT7xKp9dL",
    tokenName: "FUSE",
    tokenSymbol: "FUSE",
    walletCount: 10,
    solPerWallet: 0.09,
    returnWallet: "8aT1nC4dH6yK3zQwR5mU7bJ9sD2f5GhL9PqfE7rLm2v",
    createdAt: "2026-04-06T11:00:00.000Z",
    startedAt: "2026-04-06T11:12:00.000Z",
    endsAt: "2026-04-07T11:12:00.000Z",
    status: "stopped",
    crashCount: 0,
    restartCount: 0,
    returnedSolAmount: 0.94,
  },
];

function formatShortAddress(address: string) {
  if (!address) return "—";
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRemaining(endsAt?: string) {
  if (!endsAt) return "—";

  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getStatusLabel(status: SessionStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_payment":
      return "Awaiting Payment";
    case "payment_detected":
      return "Payment Detected";
    case "ready_to_start":
      return "Ready to Start";
    case "starting":
      return "Starting";
    case "running":
      return "Running";
    case "extending_payment_pending":
      return "Extending";
    case "stopped":
      return "Stopped";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

function getStatusVariant(
  status: SessionStatus
): "neutral" | "active" | "warning" | "success" | "danger" {
  switch (status) {
    case "running":
    case "starting":
      return "active";
    case "awaiting_payment":
    case "payment_detected":
    case "ready_to_start":
    case "extending_payment_pending":
      return "warning";
    case "completed":
      return "success";
    case "failed":
    case "expired":
    case "stopped":
      return "danger";
    default:
      return "neutral";
  }
}

export default function SessionsPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);

  const { session, loading: sessionLoading, refreshSession } = useAuthSession();
  const { disconnect, select } = useWallet();

  useBodyScrollLock(menuOpen);
  useRequireSession(sessionLoading, session);

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

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Buy Session", href: "/buy" },
    { label: "Sessions", href: "/sessions" },
    { label: "Referrals", href: "/referrals" },
    { label: "Settings", href: "/settings" },
  ];

  const actionNeededSessions = useMemo(
    () =>
      sessions.filter((s) =>
        ["awaiting_payment", "ready_to_start", "failed"].includes(s.status)
      ),
    [sessions]
  );

  const runningSessions = useMemo(
    () => sessions.filter((s) => s.status === "running"),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter((s) => ["completed", "stopped"].includes(s.status)),
    [sessions]
  );

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-slate-950 dark:text-white">
        <p className="text-sm text-black/60 dark:text-white/60">
          Checking session...
        </p>
      </main>
    );
  }

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
          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-500">
                  Sessions
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Manage all session orders in one place
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60 dark:text-white/60 sm:text-base">
                  Track payment state, launch ready sessions, monitor live
                  campaigns, and review completed session outcomes from one
                  sessions page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/buy")}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                Buy New Session
              </button>
            </div>
          </section>

          <SectionCard
            title="Action needed"
            description="These sessions require a payment, launch, or support action next."
          >
            {actionNeededSessions.length === 0 ? (
              <EmptyState text="No sessions currently require action." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {actionNeededSessions.map((item) => (
                  <SessionCard
                    key={item.id}
                    session={item}
                    primaryActionLabel={
                      item.status === "awaiting_payment"
                        ? "Complete Payment"
                        : item.status === "ready_to_start"
                        ? "Start Session"
                        : "Contact Support"
                    }
                    onPrimaryAction={() => {
                      if (item.status === "awaiting_payment") {
                        router.push("/buy");
                        return;
                      }

                      if (item.status === "ready_to_start") {
                        setSessions((prev) =>
                          prev.map((sessionItem) =>
                            sessionItem.id === item.id
                              ? {
                                  ...sessionItem,
                                  status: "running",
                                  startedAt: new Date().toISOString(),
                                  endsAt: new Date(
                                    Date.now() + 24 * 60 * 60 * 1000
                                  ).toISOString(),
                                }
                              : sessionItem
                          )
                        );
                        return;
                      }

                      window.open("https://t.me/pmprv1_bot", "_blank");
                    }}
                    secondaryActionLabel="View Details"
                    onSecondaryAction={() => router.push(`/sessions/${item.id}`)}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Running sessions"
            description="These sessions are currently active and generating live activity."
          >
            {runningSessions.length === 0 ? (
              <EmptyState text="No sessions are currently running." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {runningSessions.map((item) => (
                  <SessionCard
                    key={item.id}
                    session={item}
                    primaryActionLabel="View Live Status"
                    onPrimaryAction={() => router.push(`/sessions/${item.id}`)}
                    secondaryActionLabel="Extend 24h"
                    onSecondaryAction={() => alert(`Extend flow for ${item.id}`)}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Completed sessions"
            description="Review finished or stopped sessions and their final returned balances."
          >
            {completedSessions.length === 0 ? (
              <EmptyState text="No completed sessions yet." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {completedSessions.map((item) => (
                  <SessionCard
                    key={item.id}
                    session={item}
                    primaryActionLabel="View Summary"
                    onPrimaryAction={() => router.push(`/sessions/${item.id}`)}
                  />
                ))}
              </div>
            )}
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
};

function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900 sm:p-7">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-black dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

type EmptyStateProps = {
  text: string;
};

function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/55">
      {text}
    </div>
  );
}

type SessionCardProps = {
  session: Session;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

function SessionCard({
  session,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: SessionCardProps) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-black dark:text-white">
              {session.tokenName || session.tokenSymbol || "Unnamed Token"}
            </h3>
            <StatusBadge
              label={getStatusLabel(session.status)}
              variant={getStatusVariant(session.status)}
            />
          </div>

          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Session ID: {session.id}
          </p>
        </div>

        <div className="rounded-2xl bg-black px-4 py-3 text-white dark:bg-white dark:text-black">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/65 dark:text-black/65">
            Tier
          </p>
          <p className="mt-1 text-sm font-semibold">{session.tierName}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InfoBlock
          label="Token Address"
          value={formatShortAddress(session.tokenAddress)}
        />
        <InfoBlock label="Wallets" value={String(session.walletCount)} />
        <InfoBlock label="SOL per wallet" value={`${session.solPerWallet} SOL`} />
        <InfoBlock
          label="Return Wallet"
          value={formatShortAddress(session.returnWallet)}
        />
        <InfoBlock label="Created" value={formatDateTime(session.createdAt)} />
        <InfoBlock
          label={
            session.status === "running"
              ? "Time Remaining"
              : session.returnedSolAmount
              ? "Returned SOL"
              : "Ends / Status"
          }
          value={
            session.status === "running"
              ? formatTimeRemaining(session.endsAt)
              : session.returnedSolAmount
              ? `${session.returnedSolAmount} SOL`
              : formatDateTime(session.endsAt)
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <MetaPill label={`Crashes: ${session.crashCount}`} />
        <MetaPill label={`Restarts: ${session.restartCount}`} />
        {session.paymentAmountSol ? (
          <MetaPill label={`Fee: ${session.paymentAmountSol} SOL`} />
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
        >
          {primaryActionLabel}
        </button>

        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="rounded-2xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type InfoBlockProps = {
  label: string;
  value: string;
};

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-black dark:text-white">
        {value}
      </p>
    </div>
  );
}

type MetaPillProps = {
  label: string;
};

function MetaPill({ label }: MetaPillProps) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/72 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72">
      {label}
    </span>
  );
}

type StatusBadgeProps = {
  label: string;
  variant: "neutral" | "active" | "warning" | "success" | "danger";
};

function StatusBadge({ label, variant }: StatusBadgeProps) {
  const styles: Record<StatusBadgeProps["variant"], string> = {
    neutral:
      "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75",
    active:
      "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
    warning:
      "border-black/20 bg-black/[0.08] text-black dark:border-white/15 dark:bg-white/10 dark:text-white",
    success:
      "border-black bg-black/[0.92] text-white dark:border-white dark:bg-white dark:text-black",
    danger:
      "border-black/30 bg-black/[0.12] text-black dark:border-white/20 dark:bg-white/15 dark:text-white",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}