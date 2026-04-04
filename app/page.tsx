"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLogout } from "@/hooks/useLogout";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import PurchaseTierModal from "@/components/PurchaseTierModal";
import { TIERS, type TierConfig, type TierKey } from "@/lib/tiers";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierConfig | null>(null);
  const handleScrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");

      if (pricingSection) {
        const y = pricingSection.getBoundingClientRect().top + window.scrollY - 90;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }

      setMenuOpen(false);
    };

  const postLoginActionRef = useRef<"dashboard" | "purchase" | null>(null);

  const { disconnect, select } = useWallet();
  const {
    session,
    loading: sessionLoading,
    refreshSession,
  } = useAuthSession();

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
      setPurchaseOpen(false);
      setMenuOpen(false);
      postLoginActionRef.current = null;
    },
  });

  useBodyScrollLock(menuOpen || loginOpen || purchaseOpen);

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
      return;
    }

    if (postLoginActionRef.current === "purchase" && selectedTier) {
      postLoginActionRef.current = null;
      setLoginOpen(false);
      setPurchaseOpen(true);
    }
  }, [session, selectedTier, router]);

  const handleHeaderLogoClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push("/");
  };

  const openConnectForDashboard = () => {
    postLoginActionRef.current = "dashboard";
    setLoginOpen(true);
  };

  const openPurchaseFlow = (tierKey: TierKey) => {
    const tier = TIERS[tierKey];
    setSelectedTier(tier);

    if (!session) {
      postLoginActionRef.current = "purchase";
      setLoginOpen(true);
      return;
    }

    setPurchaseOpen(true);
  };

  const handlePaymentComplete = (tier: TierConfig) => {
    try {
      localStorage.setItem(
        "pmpr_pending_purchase",
        JSON.stringify({
          tierKey: tier.key,
          tierName: tier.name,
          priceSol: tier.priceSol,
          purchasedAt: Date.now(),
          setupRequired: true,
        })
      );
    } catch {
      // ignore storage errors
    }

    setPurchaseOpen(false);
    router.push("/dashboard");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Buy", href: "/buy" },
    { label: "Referrals", href: "/referrals" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <main className="min-h-screen bg-white text-black">
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
        primaryButtonLabel="Buy"
        onPrimaryButtonClick={handleScrollToPricing}
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

      <PurchaseTierModal
        open={purchaseOpen}
        tier={selectedTier}
        onClose={() => setPurchaseOpen(false)}
        onPaymentComplete={handlePaymentComplete}
      />

      <AppHeader
        onMenuOpen={() => setMenuOpen(true)}
        onLogoClick={handleHeaderLogoClick}
        sessionLoading={sessionLoading}
        session={session}
        onLogout={handleLogout}
        onConnect={openConnectForDashboard}
      />

      <section className="px-6 py-28">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-10 md:flex-row md:justify-between">
          <div className="max-w-3xl text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
              Solana Volume Automation
            </p>

            <h1 className="text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
              Generate Volume. <br />
              Look Like Smart Money.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-500">
              Automated Solana volume generation designed to simulate real market
              activity and help projects create stronger momentum from day one.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => openPurchaseFlow("trial")}
                className={`rounded-lg bg-black py-3 font-semibold text-white transition hover:opacity-90 ${
                  session ? "px-10 sm:min-w-[220px]" : "px-6"
                }`}
              >
                Start Free Trial
              </button>

              {!session && (
                <button
                  onClick={openConnectForDashboard}
                  className="rounded-lg border border-black px-6 py-3 font-semibold transition hover:bg-gray-100"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          <div className="flex w-full justify-center md:justify-end">
            <div className="relative flex h-[360px] w-[360px] items-center justify-center md:h-[520px] md:w-[520px]">
              <img
                src="/logo_bothead.png"
                alt="Bot logo"
                className="relative z-10 w-[640px] max-w-none drop-shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:w-[1500px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto grid max-w-7xl gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4 text-center md:text-left">
            <p className="text-sm font-semibold text-gray-400">Pricing Edge</p>
            <p className="mt-2 text-lg font-bold text-black">
              71% cheaper per $100K volume
            </p>
            <p className="mt-1 text-sm text-gray-500">vs Boost Legends</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-center md:text-left">
            <p className="text-sm font-semibold text-gray-400">
              Built For Speed
            </p>
            <p className="mt-2 text-lg font-bold text-black">
              Simple tier → pay → run flow
            </p>
            <p className="mt-1 text-sm text-gray-500">No unnecessary steps</p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-center md:text-left">
            <p className="text-sm font-semibold text-gray-400">Included</p>
            <p className="mt-2 text-lg font-bold text-black">
              Reactions included
            </p>
            <p className="mt-1 text-sm text-gray-500">Clearer social proof</p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              How It Works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Launch volume in three simple steps
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
              A fast and simple process designed to get your session live
              without unnecessary friction.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">
                1
              </div>
              <h3 className="mt-6 text-2xl font-semibold">Pick a Tier</h3>
              <p className="mt-4 leading-7 text-white/65">
                Choose the package that matches your target volume, strategy,
                and budget.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-500/15 text-lg font-bold text-fuchsia-300">
                2
              </div>
              <h3 className="mt-6 text-2xl font-semibold">Pay SOL</h3>
              <p className="mt-4 leading-7 text-white/65">
                Confirm your session with a clear payment flow and exact SOL
                amount shown upfront.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">
                3
              </div>
              <h3 className="mt-6 text-2xl font-semibold">Setup In Dashboard</h3>
              <p className="mt-4 leading-7 text-white/65">
                After payment, continue to the dashboard and configure the bot
                before starting your session.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-6 py-24 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
              Pricing
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Simple tiers, clear pricing
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
              Choose the package that matches your target volume and session
              goals. All tiers include reactions.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Trial
              </p>
              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">
                  {TIERS.trial.priceSol} SOL
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {TIERS.trial.subtitle}
                </p>
              </div>
              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                {TIERS.trial.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}
              </ul>
              <button
                onClick={() => openPurchaseFlow("trial")}
                className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90"
              >
                Select Trial
              </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Basic
              </p>
              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">
                  {TIERS.basic.priceSol} SOL
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {TIERS.basic.subtitle}
                </p>
              </div>
              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                {TIERS.basic.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}
              </ul>
              <button
                onClick={() => openPurchaseFlow("basic")}
                className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90"
              >
                Select Basic
              </button>
            </div>

            <div className="relative rounded-3xl border border-cyan-400 bg-slate-950 p-8 text-left text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
                Most Popular
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Standard
              </p>
              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">
                  {TIERS.standard.priceSol} SOL
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {TIERS.standard.subtitle}
                </p>
              </div>
              <div className="mt-6 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-300">
                Reactions included
              </div>
              <ul className="mt-8 space-y-3 text-sm text-white/75">
                {TIERS.standard.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}
              </ul>
              <button
                onClick={() => openPurchaseFlow("standard")}
                className="mt-8 w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-cyan-300"
              >
                Select Standard
              </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Pro
              </p>
              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">
                  {TIERS.pro.priceSol} SOL
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {TIERS.pro.subtitle}
                </p>
              </div>
              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>
              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                {TIERS.pro.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}
              </ul>
              <button
                onClick={() => openPurchaseFlow("pro")}
                className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90"
              >
                Select Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Social Proof
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Trusted by projects looking to create momentum
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
              Built to make launching volume campaigns simple, fast, and easier
              to trust at a glance.
            </p>
          </div>

          <div className="mt-14 text-center">
            <p className="text-6xl font-bold tracking-tight text-white md:text-7xl">
              1,200+
            </p>
            <p className="mt-3 text-lg text-white/65">
              Sessions successfully run
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <p className="text-3xl font-bold text-cyan-300">1,200+</p>
              <p className="mt-3 text-lg font-semibold">Sessions run</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                A growing number of campaigns already launched through the
                platform.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <p className="text-3xl font-bold text-fuchsia-300">Included</p>
              <p className="mt-3 text-lg font-semibold">Reactions included</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Clearer social proof and stronger perceived activity in one
                flow.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <p className="text-3xl font-bold text-cyan-300">Fast</p>
              <p className="mt-3 text-lg font-semibold">
                Simple launch process
              </p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Pick a tier, pay SOL, then configure the bot in dashboard before launch.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/35">
              More visibility. Cleaner launch flow. Stronger first impression.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo_bothead.png" alt="Logo" className="h-10 w-10" />
                <p className="text-lg font-bold">PMPR</p>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Automated Solana volume generation designed to simulate real
                market activity and help projects gain traction.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Product
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li><a href="/buy" className="hover:text-black">Buy Session</a></li>
                <li><a href="/dashboard" className="hover:text-black">Dashboard</a></li>
                <li><a href="/sessions" className="hover:text-black">Sessions</a></li>
                <li><a href="/referrals" className="hover:text-black">Referrals</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Company
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">About</a></li>
                <li><a href="#" className="hover:text-black">Support</a></li>
                <li><a href="#" className="hover:text-black">Contact</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Legal
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 md:flex-row">
            <p className="text-sm text-gray-500">©2026 PMPR. All rights reserved.</p>

            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-black">
                Telegram
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-black">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}