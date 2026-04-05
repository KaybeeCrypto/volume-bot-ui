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
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center"
    >
      <span
        className={`relative flex h-7 w-14 items-center rounded-full border-2 transition-all ${
          isDark ? "border-white bg-white/10" : "border-black bg-white"
        }`}
      >
        <span
          className={`absolute flex h-5 w-5 items-center justify-center transition-all duration-300 ${
            isDark ? "left-[30px]" : "left-[3px]"
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
      className="h-5 w-5 text-black"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="5" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
        <line x1="17.5" y1="17.5" x2="19.5" y2="19.5" />
        <line x1="17.5" y1="6.5" x2="19.5" y2="4.5" />
        <line x1="4.5" y1="19.5" x2="6.5" y2="17.5" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-white"
      fill="currentColor"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3c.5 0 .8.5.6.9A7 7 0 0 0 20.1 12c.4-.2.9.1.9.8Z" />
    </svg>
  );
}