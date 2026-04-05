"use client";

import Image from "next/image";
import SessionActionButton from "@/components/SessionActionButton";

type SessionLike = {
  address: string;
} | null;

type AppHeaderProps = {
  onMenuOpen: () => void;
  onLogoClick: () => void;
  sessionLoading: boolean;
  session: SessionLike;
  onLogout: () => void | Promise<void>;
  onConnect?: () => void;
};

export default function AppHeader({
  onMenuOpen,
  onLogoClick,
  sessionLoading,
  session,
  onLogout,
  onConnect,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 relative flex h-24 items-center border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90">
      <button
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md transition hover:bg-gray-100 dark:hover:bg-white/10"
        aria-label="Open menu"
        onClick={onMenuOpen}
      >
        <span className="block h-0.5 w-6 bg-black dark:bg-white"></span>
        <span className="block h-0.5 w-6 bg-black dark:bg-white"></span>
        <span className="block h-0.5 w-6 bg-black dark:bg-white"></span>
      </button>

      <button
          type="button"
          onClick={onLogoClick}
          className="absolute left-1/2 max-w-[120px] -translate-x-1/2 transition hover:opacity-90 sm:max-w-[150px] md:max-w-none"
          aria-label="Go to main page"
        >
        <Image
          src="/logo.png"
          alt="VolumeBot logo"
          width={220}
          height={44}
          priority
        />
      </button>

      <div className="relative ml-auto flex items-center gap-2">
        <SessionActionButton
          sessionLoading={sessionLoading}
          session={session}
          onLogout={onLogout}
          onConnect={onConnect}
          loggedOutLabel="Connect"
        />
      </div>
    </header>
  );
}