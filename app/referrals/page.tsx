"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import SideMenu from "@/components/SideMenu";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useLogout } from "@/hooks/useLogout";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useRequireSession } from "@/hooks/useRequireSession";

type ReferralStatus = "Active" | "Pending";

type ReferralItem = {
  id: string;
  user: string;
  status: ReferralStatus;
  earned: string;
  date: string;
};

function shortenAddress(address?: string | null) {
  if (!address) return "Unknown";
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function ReferralsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useAuthSession();
  const { handleLogout } = useLogout();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useBodyScrollLock(menuOpen);
  useRequireSession(sessionLoading, session);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Referrals", href: "/referrals" },
  ];

  const referralCode = useMemo(() => {
    const base =
      session?.address
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 10)
        .toUpperCase() || "PMPR123";
    return base;
  }, [session]);

  const referralLink = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/signup?ref=${referralCode}`;
    }
    return `https://yourdomain.com/signup?ref=${referralCode}`;
  }, [referralCode]);

  const referralStats = useMemo(
    () => ({
      totalEarned: "€0",
      activeReferrals: 0,
      pendingRewards: "€0",
      progressCurrent: 0,
      progressGoal: 10,
    }),
    []
  );

  const referrals: ReferralItem[] = useMemo(
    () => [
      // Example rows, remove these comments when real API data is connected
      // {
      //   id: "1",
      //   user: "7xKp...93Lm",
      //   status: "Active",
      //   earned: "€25",
      //   date: "04 Apr 2026",
      // },
    ],
    []
  );

  const progressPercent =
    referralStats.progressGoal > 0
      ? Math.min(
          100,
          Math.round(
            (referralStats.progressCurrent / referralStats.progressGoal) * 100
          )
        )
      : 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function handleShare() {
    try {
      setShareLoading(true);

      if (navigator.share) {
        await navigator.share({
          title: "Join PMPR",
          text: "Use my referral link to sign up.",
          url: referralLink,
        });
        return;
      }

      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } finally {
      setShareLoading(false);
    }
  }

  const walletDisplay = shortenAddress(session?.address);

  if (sessionLoading) return null;

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

      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-black/10 bg-gradient-to-b from-white to-neutral-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex rounded-full border border-black/10 bg-black px-3 py-1 text-xs font-medium text-white">
                Referral Program
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Invite users and earn from every successful referral
              </h1>

              <p className="mt-2 text-sm leading-6 text-black/60 sm:text-base">
                Share your referral link, track who joined through you, and keep
                all referral performance in one clean overview.
              </p>
            </div>

            <div className="min-w-[240px] rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-black/50">
                Your wallet
              </div>
              <div className="mt-2 text-lg font-semibold">{walletDisplay}</div>
              <div className="mt-3 text-xs text-black/50">
                Referral code:{" "}
                <span className="font-semibold text-black">{referralCode}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-sm text-black/55">Total Earned</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {referralStats.totalEarned}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-sm text-black/55">Active Referrals</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {referralStats.activeReferrals}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-sm text-black/55">Pending Rewards</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {referralStats.pendingRewards}
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Your referral link</h2>
              <p className="mt-1 text-sm text-black/55">
                Copy and share this link to bring new users into the platform.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={referralLink}
                readOnly
                className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm outline-none"
              />

              <button
                type="button"
                onClick={handleCopy}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
                className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {shareLoading ? "Sharing..." : "Share"}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-neutral-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-black/45">
                Short code
              </div>
              <div className="mt-1 text-sm font-semibold">{referralCode}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Progress</h2>
              <p className="mt-1 text-sm text-black/55">
                A simple milestone view to keep the page motivating.
              </p>
            </div>

            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-black/60">Referral goal</span>
              <span className="font-medium">
                {referralStats.progressCurrent} / {referralStats.progressGoal}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 text-xs text-black/50">
              {progressPercent}% completed
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold">Your referrals</h2>
            <p className="mt-1 text-sm text-black/55">
              Track who joined through your link and what they have generated.
            </p>
          </div>

          {referrals.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-neutral-50 text-xl">
                ↗
              </div>
              <h3 className="text-base font-semibold">No referrals yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-black/55">
                Share your referral link to start building your referral network
                and earning rewards.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-black/55">
                  <tr>
                    <th className="px-5 py-3 font-medium sm:px-6">User</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Earned</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {referrals.map((item) => (
                    <tr key={item.id} className="border-t border-black/10">
                      <td className="px-5 py-4 font-medium sm:px-6">
                        {item.user}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === "Active"
                              ? "bg-black text-white"
                              : "border border-black/10 bg-neutral-100 text-black"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">{item.earned}</td>
                      <td className="px-5 py-4 sm:px-6">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}