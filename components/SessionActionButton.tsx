"use client";

import { useState } from "react";

type SessionLike = {
  address: string;
} | null;

type SessionActionButtonProps = {
  sessionLoading: boolean;
  session: SessionLike;
  onLogout: () => void | Promise<void>;
  onConnect?: () => void;
  classNameWhenLoggedIn?: string;
  classNameWhenLoggedOut?: string;
  hoverLoggedInClassName?: string;
  idleLoggedInClassName?: string;
  loggedOutLabel?: string;
  fullWidth?: boolean;
};

export default function SessionActionButton({
  sessionLoading,
  session,
  onLogout,
  onConnect,
  classNameWhenLoggedIn = "",
  classNameWhenLoggedOut = "",
  hoverLoggedInClassName = "",
  idleLoggedInClassName = "",
  loggedOutLabel = "Connect Wallet",
  fullWidth = false,
}: SessionActionButtonProps) {
  const [hovered, setHovered] = useState(false);

  if (sessionLoading) {
    return null;
  }

  if (session) {
    return (
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onLogout}
        className={`${fullWidth ? "w-full" : ""} ${
          hovered ? hoverLoggedInClassName : idleLoggedInClassName
        } ${classNameWhenLoggedIn}`}
      >
        {hovered ? "Logout" : `${session.address.slice(0, 4)}...`}
      </button>
    );
  }

  return (
    <button
      onClick={onConnect}
      className={`${fullWidth ? "w-full" : ""} ${classNameWhenLoggedOut}`}
    >
      {loggedOutLabel}
    </button>
  );
}