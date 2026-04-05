"use client";

import Link from "next/link";
import SessionActionButton from "@/components/SessionActionButton";
import ThemeToggle from "@/components/ThemeToggle";

type SessionLike = {
  address: string;
} | null;

type NavItem = {
  label: string;
  href: string;
};

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  sessionLoading: boolean;
  session: SessionLike;
  onLogout: () => void | Promise<void>;
  onConnect?: () => void;
  showPrimaryButton?: boolean;
  primaryButtonLabel?: string;
  onPrimaryButtonClick?: () => void;
};

export default function SideMenu({
  open,
  onClose,
  navItems,
  sessionLoading,
  session,
  onLogout,
  onConnect,
  showPrimaryButton = false,
  primaryButtonLabel = "Start Free Trial",
  onPrimaryButtonClick,
}: SideMenuProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
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
              onClick={onClose}
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
            {navItems.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/10 hover:text-cyan-300"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex flex-col gap-3">
            {showPrimaryButton && (
              <button
                type="button"
                onClick={onPrimaryButtonClick}
                className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                {primaryButtonLabel}
              </button>
            )}

            <div className="w-full">
              <ThemeToggle />
            </div>

            <SessionActionButton
              fullWidth
              sessionLoading={sessionLoading}
              session={session}
              onLogout={onLogout}
              onConnect={onConnect}
              classNameWhenLoggedIn="rounded-lg border px-4 py-3 text-sm font-semibold transition"
              idleLoggedInClassName="border-white/20 text-white hover:bg-white/10"
              hoverLoggedInClassName="border-red-500 bg-red-500 text-white"
              classNameWhenLoggedOut="rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            />
          </div>
        </div>
      </div>
    </>
  );
}