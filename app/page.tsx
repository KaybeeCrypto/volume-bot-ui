"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WalletPicker from "@/components/WalletPicker";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [headerLogoutHover, setHeaderLogoutHover] = useState(false);
  const [menuLogoutHover, setMenuLogoutHover] = useState(false);
  const { connected } = useWallet();
  const { session, loading: sessionLoading } = useAuthSession();

  useEffect(() => {
    if (connected) {
      setLoginOpen(false);
    }
  }, [connected]);

  const handleHeaderLogoClick = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push("/");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {loginOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setLoginOpen(false)}
          />

          <div className="relative z-10 w-full max-w-[450px] rounded-3xl bg-white px-8 py-9 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Connect Wallet</h2>
              <button
                onClick={() => setLoginOpen(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="mt-8 flex min-h-[170px] flex-col items-center justify-center">
              <WalletPicker onSuccess={() => setLoginOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed top-0 left-0 z-50 flex h-full w-80 flex-col bg-slate-950 text-white shadow-2xl transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo_bothead.png"
                alt="Bot logo"
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="text-lg font-bold tracking-tight">PMPR</p>
                <p className="text-sm text-white/60">PMPR Panel</p>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-1 text-2xl leading-none text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Navigation
          </p>

          <nav className="flex flex-col gap-1">
            <a
              href="/"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="/dashboard"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </a>
            <a
              href="/buy"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
              onClick={() => setMenuOpen(false)}
            >
              Buy
            </a>
            <a
              href="/referrals"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
              onClick={() => setMenuOpen(false)}
            >
              Referrals
            </a>
            <a
              href="/settings"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </a>
          </nav>
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex flex-col gap-3">
            <button className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300">
              Start Free Trial
            </button>

            {sessionLoading ? null : session ? (
              <button
                onMouseEnter={() => setMenuLogoutHover(true)}
                onMouseLeave={() => setMenuLogoutHover(false)}
                onClick={handleLogout}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  menuLogoutHover
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {menuLogoutHover
                  ? "Logout"
                  : `${session.address.slice(0, 4)}...`}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setLoginOpen(true);
                }}
                className="rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 relative flex items-center h-24 px-4 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md transition hover:bg-gray-100"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
          <span className="block w-6 h-0.5 bg-black"></span>
        </button>

        <button
          type="button"
          onClick={handleHeaderLogoClick}
          className="absolute left-1/2 -translate-x-1/2 transition hover:opacity-90"
          aria-label="Go to main page"
        >
          <Image
            src="/logo.png"
            alt="VolumeBot logo"
            width={300}
            height={60}
            priority
          />
        </button>

        <div className="ml-auto">
          {sessionLoading ? null : session ? (
            <button
              onMouseEnter={() => setHeaderLogoutHover(true)}
              onMouseLeave={() => setHeaderLogoutHover(false)}
              onClick={handleLogout}
              className={`rounded-lg border px-5 py-2 font-semibold transition ${
                headerLogoutHover
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-black text-black hover:bg-gray-100"
              }`}
            >
              {headerLogoutHover
                ? "Logout"
                : `${session.address.slice(0, 4)}...`}
            </button>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-lg border border-black px-5 py-2 font-semibold transition hover:bg-black hover:text-white"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <section className="px-6 py-28">
        <div className="mx-auto max-w-7xl flex flex-col-reverse items-center gap-10 md:flex-row md:justify-between">
          <div className="max-w-3xl text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-500">
              Solana Volume Automation
            </p>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Generate Volume. <br />
              Look Like Smart Money.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-500">
              Automated Solana volume generation designed to simulate real market
              activity and help projects create stronger momentum from day one.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                className={`rounded-lg bg-black py-3 font-semibold text-white transition hover:opacity-90 ${
                  session ? "px-10 sm:min-w-[220px]" : "px-6"
                }`}
              >
                Start Free Trial
              </button>

              {!session && (
                <button
                  onClick={() => setLoginOpen(true)}
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

              <h3 className="mt-6 text-2xl font-semibold">Bot Runs</h3>

              <p className="mt-4 leading-7 text-white/65">
                Once confirmed, the bot starts running and begins generating
                visible market activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24 text-black">
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
                <p className="text-4xl font-bold tracking-tight">X SOL</p>
                <p className="mt-2 text-sm text-gray-500">
                  Best for testing the flow
                </p>
              </div>

              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                <li>✔ Entry-level session</li>
                <li>✔ Volume generation</li>
                <li>✔ Clear setup flow</li>
                <li>✔ Fast launch</li>
              </ul>

              <button className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90">
                Select Trial
              </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Basic
              </p>

              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">X SOL</p>
                <p className="mt-2 text-sm text-gray-500">
                  Solid starting point for smaller launches
                </p>
              </div>

              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                <li>✔ Reliable activity boost</li>
                <li>✔ Volume generation</li>
                <li>✔ Good budget balance</li>
                <li>✔ Straightforward setup</li>
              </ul>

              <button className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90">
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
                <p className="text-4xl font-bold tracking-tight">X SOL</p>
                <p className="mt-2 text-sm text-white/60">
                  Best balance of cost and visible impact
                </p>
              </div>

              <div className="mt-6 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-300">
                Reactions included
              </div>

              <ul className="mt-8 space-y-3 text-sm text-white/75">
                <li>✔ Stronger activity profile</li>
                <li>✔ Volume generation</li>
                <li>✔ Better social proof effect</li>
                <li>✔ Ideal default choice</li>
              </ul>

              <button className="mt-8 w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-cyan-300">
                Select Standard
              </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Pro
              </p>

              <div className="mt-5">
                <p className="text-4xl font-bold tracking-tight">X SOL</p>
                <p className="mt-2 text-sm text-gray-500">
                  For bigger pushes and stronger session coverage
                </p>
              </div>

              <div className="mt-6 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                Reactions included
              </div>

              <ul className="mt-8 space-y-3 text-sm text-gray-600">
                <li>✔ Higher session intensity</li>
                <li>✔ Volume generation</li>
                <li>✔ Broader visible activity</li>
                <li>✔ Premium tier option</li>
              </ul>

              <button className="mt-8 w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:opacity-90">
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
                Pick a tier, pay SOL, and get the session running without
                unnecessary friction.
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
                <li>
                  <a href="/buy" className="hover:text-black">
                    Buy Session
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="hover:text-black">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/sessions" className="hover:text-black">
                    Sessions
                  </a>
                </li>
                <li>
                  <a href="/referrals" className="hover:text-black">
                    Referrals
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Company
              </p>

              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-black">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Legal
              </p>

              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-black">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-black">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 md:flex-row">
            <p className="text-sm text-gray-500">
              ©2026 PMPR. All rights reserved.
            </p>

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