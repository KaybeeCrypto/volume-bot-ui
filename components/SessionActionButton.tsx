"use client";

import { useEffect, useRef, useState } from "react";

type SessionLike = {
  address: string;
} | null;

type SessionActionButtonProps = {
  sessionLoading: boolean;
  session: SessionLike;
  onLogout: () => void | Promise<void>;
  onConnect?: () => void;
  loggedOutLabel?: string;
  fullWidth?: boolean;
};

export default function SessionActionButton({
  sessionLoading,
  session,
  onLogout,
  onConnect,
  loggedOutLabel = "Connect Wallet",
  fullWidth = false,
}: SessionActionButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopyAddress = async () => {
    if (!session?.address) return;

    try {
      await navigator.clipboard.writeText(session.address);
      setCopied(true);
      setMenuOpen(false);
    } catch {
      setCopied(false);
    }
  };

  if (sessionLoading) {
    return null;
  }

  if (session) {
    return (
      <div
        ref={wrapperRef}
        className={`relative ${fullWidth ? "w-full" : ""}`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`group inline-flex h-11 items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] shadow-[0_0_0_rgba(0,0,0,0)] transition duration-200 hover:shadow-[0_0_18px_rgba(59,130,246,0.22)] focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
            fullWidth ? "w-full" : ""
          }`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="inline-flex h-full w-full items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white dark:bg-slate-950">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span>{formatAddress(session.address)}</span>
            <span
              className={`text-[10px] text-white/70 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </span>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-slate-900"
            role="menu"
          >
            <button
              type="button"
              onClick={handleCopyAddress}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-black transition hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.06]"
              role="menuitem"
            >
              <span>{copied ? "Copied" : "Copy Address"}</span>
              <span className="text-black/40 dark:text-white/40">⧉</span>
            </button>

            <a
              href={`https://solscan.io/account/${session.address}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium text-black transition hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.06]"
              role="menuitem"
            >
              <span>View on Solscan</span>
              <span className="text-black/40 dark:text-white/40">↗</span>
            </a>

            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await onLogout();
              }}
              className="flex w-full items-center justify-between border-t border-black/10 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-white/10 dark:hover:bg-white/[0.06]"
              role="menuitem"
            >
              <span>Logout</span>
              <span className="text-red-400">⎋</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      className={`group inline-flex h-11 items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] shadow-[0_0_0_rgba(0,0,0,0)] transition duration-200 hover:shadow-[0_0_18px_rgba(59,130,246,0.22)] focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white dark:bg-slate-950">
        {loggedOutLabel}
      </span>
    </button>
  );
}