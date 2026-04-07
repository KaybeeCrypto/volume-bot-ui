"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import AppHeader from "@/components/AppHeader";
import DevDisclaimer from "@/components/DevDisclaimer";
import SideMenu from "@/components/SideMenu";

import { useAuthSession } from "@/hooks/useAuthSession";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useLogout } from "@/hooks/useLogout";
import { useRequireSession } from "@/hooks/useRequireSession";

import type { Session, SessionStatus } from "@/types/session";

/* ---------------- MOCK DATA ---------------- */

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
];

/* ---------------- HELPERS ---------------- */

function formatShortAddress(address?: string) {
  if (!address) return "—";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatTimeRemaining(endsAt?: string) {
  if (!endsAt) return "—";

  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return `${hours}h ${minutes}m`;
}

function getStatusLabel(status: SessionStatus) {
  return status.replaceAll("_", " ");
}

/* ---------------- PAGE ---------------- */

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  const { session, loading, refreshSession } = useAuthSession();
  const { disconnect, select } = useWallet();

  useBodyScrollLock(menuOpen);
  useRequireSession(loading, session);

  const { handleLogout } = useLogout({
    disconnectWallet: async () => {
      try { await disconnect(); } catch {}
      try { select(null); } catch {}
      try { localStorage.removeItem("walletName"); } catch {}
    },
    onLoggedOut: async () => {
      await refreshSession();
      setMenuOpen(false);
    },
  });

  const sessionId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  /* ✅ FIXED: useEffect instead of useMemo */
  useEffect(() => {
    const found = MOCK_SESSIONS.find((s) => s.id === sessionId) || null;
    setSessionData(found);
  }, [sessionId]);

  if (loading || !session) return null;

  if (!sessionData) {
    return (
      <main className="p-10 text-center">
        <p>Session not found</p>
        <button onClick={() => router.push("/sessions")}>
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={[
          { label: "Sessions", href: "/sessions" },
        ]}
        sessionLoading={loading}
        session={session}
        onLogout={handleLogout}
      />

      <AppHeader
        onMenuOpen={() => setMenuOpen(true)}
        onLogoClick={() => router.push("/")}
        sessionLoading={loading}
        session={session}
        onLogout={handleLogout}
      />

      <DevDisclaimer />

      <section className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">
          {sessionData.tokenName}
        </h1>

        <p>Session ID: {sessionData.id}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Token" value={sessionData.tokenSymbol} />
          <Info label="Wallets" value={String(sessionData.walletCount)} />
          <Info label="SOL / wallet" value={`${sessionData.solPerWallet} SOL`} />
          <Info label="Return wallet" value={formatShortAddress(sessionData.returnWallet)} />
          <Info label="Created" value={formatDateTime(sessionData.createdAt)} />
          <Info label="Ends" value={formatDateTime(sessionData.endsAt)} />
          <Info label="Remaining" value={formatTimeRemaining(sessionData.endsAt)} />
        </div>

        {sessionData.status === "awaiting_payment" && (
          <div className="p-4 border rounded">
            <p>Payment required</p>
            <p>{sessionData.paymentAmountSol} SOL</p>
            <p>{formatShortAddress(sessionData.paymentAddress)}</p>
          </div>
        )}

        {sessionData.status === "running" && (
          <div className="flex gap-3">
            <button className="bg-black text-white px-4 py-2 rounded">
              Extend
            </button>
            <button className="border px-4 py-2 rounded">
              Stop
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border p-3 rounded">
      <p className="text-xs opacity-60">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}