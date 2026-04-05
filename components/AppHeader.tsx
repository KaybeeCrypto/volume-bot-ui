"use client";

import Image from "next/image";
import SessionActionButton from "@/components/SessionActionButton";
import ThemeToggle from "@/components/ThemeToggle";

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

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />

        <SessionActionButton
          sessionLoading={sessionLoading}
          session={session}
          onLogout={onLogout}
          onConnect={onConnect}
          classNameWhenLoggedIn="rounded-lg border px-5 py-2 font-semibold transition"
          idleLoggedInClassName="border-black text-black hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-white/10"
          hoverLoggedInClassName="border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          classNameWhenLoggedOut="rounded-lg border border-black px-5 py-2 font-semibold transition hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
        />
      </div>
    </header>
  );
}