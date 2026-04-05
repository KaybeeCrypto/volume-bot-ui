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
      className="inline-flex items-center gap-3 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative flex h-7 w-14 items-center rounded-full border-2 transition-all ${
          isDark
            ? "border-white bg-white/10"
            : "border-black bg-white"
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

      <span
        className={`text-sm font-semibold ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        Theme: {mounted ? (isDark ? "Dark" : "Light") : "Light"}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.9 4.9l1.8 1.8" />
      <path d="M17.3 17.3l1.8 1.8" />
      <path d="M19.1 4.9l-1.8 1.8" />
      <path d="M6.7 17.3l-1.8 1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14.5 2.5c-1 1.2-1.6 2.8-1.6 4.5 0 4.1 3.4 7.5 7.5 7.5.4 0 .8 0 1.2-.1-1.2 4.2-5 7.1-9.5 7.1-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.2-9.9.3-.1.6-.1.8-.1 1 0 2.3.3 3.4 1Z" />
    </svg>
  );
}