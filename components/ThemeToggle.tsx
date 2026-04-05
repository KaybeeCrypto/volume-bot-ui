"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative flex h-7 w-14 items-center rounded-full border-2 transition-all ${
          isDark ? "border-white bg-white/10" : "border-black bg-white"
        }`}
      >
        <span
          className={`absolute flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
            isDark
              ? "left-[30px] bg-white text-black"
              : "left-[3px] bg-black text-yellow-400"
          }`}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M5 5l1.5 1.5" />
      <path d="M17.5 17.5L19 19" />
      <path d="M19 5l-1.5 1.5" />
      <path d="M6.5 17.5L5 19" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 18a7.5 7.5 0 1 1-5-14.5Z" />
    </svg>
  );
}