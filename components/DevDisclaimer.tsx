"use client";

import { useEffect, useState } from "react";

export default function DevDisclaimer() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const dismissed = localStorage.getItem("pmpr_dev_disclaimer_dismissed");

      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem("pmpr_dev_disclaimer_dismissed", "true");
    } catch {
      // ignore errors
    }

    setVisible(false);
  };

  // Prevent hydration mismatch / flicker
  if (!mounted || !visible) return null;

  return (
    <div className="border-b border-black/10 bg-black/[0.04] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 px-6 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full border border-black/10 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
            Preview
          </div>

          <p className="min-w-0 text-sm leading-6 text-black/65 dark:text-white/65">
            This interface currently displays preview content only. All shown metrics,
            charts, activity, balances, and other platform data are illustrative and may
            differ from the final live environment once the product is fully operational.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/65 transition hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/[0.06] dark:text-white/65 dark:hover:bg-white/[0.12] dark:hover:text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}