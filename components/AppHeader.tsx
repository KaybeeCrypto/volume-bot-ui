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
    <header className="sticky top-0 z-30 relative flex items-center h-24 px-4 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <button
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md transition hover:bg-gray-100"
        aria-label="Open menu"
        onClick={onMenuOpen}
      >
        <span className="block w-6 h-0.5 bg-black"></span>
        <span className="block w-6 h-0.5 bg-black"></span>
        <span className="block w-6 h-0.5 bg-black"></span>
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

      <div className="ml-auto">
        <SessionActionButton
          sessionLoading={sessionLoading}
          session={session}
          onLogout={onLogout}
          onConnect={onConnect}
          classNameWhenLoggedIn="rounded-lg border px-5 py-2 font-semibold transition"
          idleLoggedInClassName="border-black text-black hover:bg-gray-100"
          hoverLoggedInClassName="border-black bg-black text-white"
          classNameWhenLoggedOut="rounded-lg border border-black px-5 py-2 font-semibold transition hover:bg-black hover:text-white"
        />
      </div>
    </header>
  );
}