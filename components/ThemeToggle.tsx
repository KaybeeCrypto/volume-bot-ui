"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      className="rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-60 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
      aria-label="Toggle theme"
    >
      {!mounted ? "Theme" : theme === "light" ? "Dark Mode" : "Light Mode"}
    </button>
  );
}