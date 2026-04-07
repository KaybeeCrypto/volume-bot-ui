"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import AppHeader from "@/components/AppHeader";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import DevDisclaimer from "@/components/DevDisclaimer";
import SideMenu from "@/components/SideMenu";

import { useAuthSession } from "@/hooks/useAuthSession";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useLogout } from "@/hooks/useLogout";
import { useWalletAuth } from "@/hooks/useWalletAuth";

import { TIERS } from "@/lib/tiers";
import type { TierConfig } from "@/types/tier";

export default function Home() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const postLoginActionRef = useRef<"dashboard" | null>(null);

  const { disconnect, select } = useWallet();
  const {
    session,
    loading: sessionLoading,
    refreshSession,
  } = useAuthSession();

  useBodyScrollLock(menuOpen || loginOpen);

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
      setLoginOpen(false);
      setMenuOpen(false);
      postLoginActionRef.current = null;
    },
  });

  const { authLoading, authError } = useWalletAuth({
    enabled: loginOpen,
    session,
    refreshSession,
    onAuthenticated: () => {
      setLoginOpen(false);
    },
  });

  useEffect(() => {
    if (!session || !postLoginActionRef.current) return;

    if (postLoginActionRef.current === "dashboard") {
      postLoginActionRef.current = null;
      setLoginOpen(false);
      router.replace("/dashboard");
    }
  }, [session, router]);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Buy Session", href: "/buy" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sessions", href: "/sessions" },
      { label: "Referrals", href: "/referrals" },
      { label: "Settings", href: "/settings" },
    ],
    []
  );

  function handleHeaderLogoClick() {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push("/");
  }

  function openConnectForDashboard() {
    postLoginActionRef.current = "dashboard";
    setLoginOpen(true);
  }

  function scrollToSection(id: string, offset = 90) {
    setMenuOpen(false);

    const section = document.getElementById(id);
    if (!section) return;

    const y = section.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  }

  function handleBuyNow(tier: TierConfig) {
    if (tier.managed) {
      scrollToSection("support");
      return;
    }

    router.push(`/buy?tier=${tier.key}`);
  }

  function formatDuration(hours: number) {
    if (hours % 24 === 0) {
      const days = hours / 24;
      return `${days}d`;
    }

    return `${hours}h`;
  }

  const faqItems = [
    {
      question: "My payment was sent but not confirmed.",
      answer:
        "Wait up to 5 minutes for blockchain confirmation. If it still is not confirmed after 10 minutes, contact support with your transaction hash.",
    },
    {
      question: "Can I run two sessions on the same token?",
      answer:
        "One session per token per account. Contact support if you need a custom multi-session arrangement.",
    },
    {
      question: "What happens if the bot crashes?",
      answer:
        "The system automatically attempts up to 3 restarts. If it still fails, you are notified and can contact support.",
    },
    {
      question: "Can I use this on pump.fun tokens?",
      answer:
        "Yes. The system can detect bonding-curve or DEX routing and handle the session accordingly.",
    },
    {
      question: "What happens when the session ends?",
      answer:
        "Trading stops, remaining SOL is swept back to your return wallet, and you receive a completion update.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-black dark:bg-slate-950 dark:text-white">
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={navItems}
        sessionLoading={sessionLoading}
        session={session}
        onLogout={handleLogout}
        onConnect={() => {
          setMenuOpen(false);
          openConnectForDashboard();
        }}
        showPrimaryButton
        primaryButtonLabel="Buy Session"
        onPrimaryButtonClick={() => scrollToSection("pricing")}
      />

      <ConnectWalletModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          postLoginActionRef.current = null;
        }}
        authLoading={authLoading}
        authError={authError}
      />

      <AppHeader
        onMenuOpen={() => setMenuOpen(true)}
        onLogoClick={handleHeaderLogoClick}
        sessionLoading={sessionLoading}
        session={session}
        onLogout={handleLogout}
        onConnect={openConnectForDashboard}
      />

      <DevDisclaimer />

      <section className="px-6 pb-20 pt-20 md:pb-24 md:pt-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="relative flex h-[220px] w-[220px] items-center justify-center md:h-[320px] md:w-[320px]">
            <img
              src="/logo_bothead.png"
              alt="Volbot"
              className="w-[320px] drop-shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:w-[420px]"
            />
          </div>

          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
            Solana Volume Sessions
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Launch and manage Solana volume sessions from one place.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-white/65">
            PMPR helps generate trading activity, wallet rotation, and
            visibility signals across the tools traders already watch. Choose a
            tier, validate your token, pay the exact amount, and start your
            session.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/buy")}
              className="rounded-xl bg-black px-8 py-3.5 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              Buy Session
            </button>

            <button
              onClick={() => scrollToSection("how-it-works")}
              className="rounded-xl border border-black px-8 py-3.5 font-semibold transition hover:bg-gray-100 dark:border-white dark:hover:bg-white/10"
            >
              How It Works
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-white/45">
            <span>3-hour payment window</span>
            <span>•</span>
            <span>Return wallet support</span>
            <span>•</span>
            <span>Session tracking in dashboard</span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-7xl rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-white/40">
              Visibility Targets
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Built for the places traders actually look
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-white/60">
              PMPR is designed to support visibility signals across the
              platforms that shape early token attention.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["DexScreener", "GMGN", "Axiom", "Photon"].map((platform) => (
              <div
                key={platform}
                className="rounded-2xl bg-gray-50 px-5 py-6 text-center text-lg font-semibold dark:bg-white/5"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-slate-950 px-6 py-24 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              How It Works
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
              The flow is simple, but it is structured. Every session follows
              the same path so the process stays clear.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                number: "1",
                title: "Choose your tier",
                text: "Pick the package that matches your campaign size, duration, and wallet count.",
              },
              {
                number: "2",
                title: "Enter your token",
                text: "Paste your contract address and let the system validate on-chain availability, liquidity, and tradeability.",
              },
              {
                number: "3",
                title: "Configure wallets",
                text: "Set wallet activity details for the selected tier before creating the session order.",
              },
              {
                number: "4",
                title: "Set return wallet",
                text: "Choose the wallet that receives unused SOL back when the session ends or stops early.",
              },
              {
                number: "5",
                title: "Pay and start",
                text: "Send the exact amount, wait for payment confirmation, then start the session from your dashboard.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">
                  {step.number}
                </div>

                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="bg-white px-6 py-24 text-black dark:bg-slate-950 dark:text-white"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
              Tiers
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Choose the right session tier
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-white/60">
              Self-serve tiers can be configured directly online. Managed tiers
              require support setup.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {TIERS.map((tier) => {
              const isFeatured = tier.key === "standard";
              const isManaged = tier.managed;

              return (
                <div
                  key={tier.key}
                  className={`relative rounded-3xl border p-8 text-left transition ${
                    isFeatured
                      ? "border-cyan-400 bg-slate-950 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] hover:-translate-y-1 hover:shadow-2xl"
                      : "border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                        isFeatured
                          ? "text-cyan-300"
                          : "text-gray-400 dark:text-white/40"
                      }`}
                    >
                      {tier.name}
                    </p>

                    {isManaged && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isFeatured
                            ? "bg-white/10 text-white"
                            : "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                        }`}
                      >
                        Managed
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-4xl font-bold tracking-tight">
                      {tier.priceSol} SOL
                    </p>
                    <p
                      className={`mt-2 text-sm ${
                        isFeatured
                          ? "text-white/60"
                          : "text-gray-500 dark:text-white/60"
                      }`}
                    >
                      {formatDuration(tier.durationHours)} · {tier.walletCount}{" "}
                      wallets
                    </p>
                  </div>

                  <ul
                    className={`mt-8 space-y-3 text-sm ${
                      isFeatured
                        ? "text-white/75"
                        : "text-gray-600 dark:text-white/70"
                    }`}
                  >
                    {tier.features.map((feature) => (
                      <li key={feature}>✔ {feature}</li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleBuyNow(tier)}
                    className={`mt-8 w-full rounded-xl py-3 font-semibold transition ${
                      isFeatured
                        ? "bg-white text-black hover:bg-cyan-300"
                        : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black"
                    }`}
                  >
                    {isManaged ? "Contact Support" : `Choose ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              FAQ
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              The main questions, answered directly
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
              Keep the buying and session rules clear before money is sent and
              before the session starts.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-500">
              Referrals
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Earn SOL by referring users
            </h2>
            <p className="mt-4 text-gray-600 dark:text-white/60">
              Referral earnings are built into the product. New referrals pay
              15% for the first 30 days after registration, then 10% after that.
              Payouts are automatic once the minimum threshold is met.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-gray-100 px-3 py-1.5 dark:bg-white/5">
                15% first 30 days
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1.5 dark:bg-white/5">
                10% after 30 days
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1.5 dark:bg-white/5">
                Auto payouts
              </span>
            </div>

            <button
              onClick={() => router.push("/referrals")}
              className="mt-8 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              View Referrals
            </button>
          </div>

          <div
            id="support"
            className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-white/10 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-500">
              Support
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Payment issue, managed tier request, or session problem?
            </h2>
            <p className="mt-4 text-gray-600 dark:text-white/60">
              Contact support when a payment is delayed, the wrong amount was
              sent, you need a managed tier configured, or a session requires
              intervention. Include your session ID whenever possible.
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-white/60">
              <p>• Payment not confirmed</p>
              <p>• Wrong amount sent</p>
              <p>• Alpha or Launch Kit setup</p>
              <p>• Session restart or failure issue</p>
            </div>

            <button
              onClick={() => window.open("https://t.me/pmprv1_bot", "_blank")}
              className="mt-8 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-6 py-16 dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo_bothead.png" alt="Logo" className="h-10 w-10" />
                <p className="text-lg font-bold">PMPR</p>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-white/60">
                Solana volume sessions with a clearer buying flow, session
                tracking, and referral support.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">
                Product
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-white/65">
                <li>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-black dark:hover:text-white"
                  >
                    Buy Session
                  </button>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    className="hover:text-black dark:hover:text-white"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/sessions"
                    className="hover:text-black dark:hover:text-white"
                  >
                    Sessions
                  </a>
                </li>
                <li>
                  <a
                    href="/referrals"
                    className="hover:text-black dark:hover:text-white"
                  >
                    Referrals
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">
                Learn
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-white/65">
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-black dark:hover:text-white"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("support")}
                    className="hover:text-black dark:hover:text-white"
                  >
                    Support
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">
                Access
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-white/65">
                <li>
                  <a
                    href="/login"
                    className="hover:text-black dark:hover:text-white"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    href="/settings"
                    className="hover:text-black dark:hover:text-white"
                  >
                    Settings
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-white/10 md:flex-row">
            <p className="text-sm text-gray-500 dark:text-white/60">
              ©2026 PMPR. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => window.open("https://t.me/pmprv1_bot", "_blank")}
                className="text-sm text-gray-500 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                Telegram
              </button>
              <button
                onClick={() => scrollToSection("support")}
                className="text-sm text-gray-500 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}