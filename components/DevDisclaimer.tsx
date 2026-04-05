"use client";

import { useEffect, useState } from "react";

export default function DevDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);

    try {
      const dismissed = window.localStorage.getItem("pmpr_dev_disclaimer_dismissed");
      if (dismissed !== "true") {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem("pmpr_dev_disclaimer_dismissed", "true");
    } catch {
      // ignore storage errors
    }

    setIsVisible(false);
  };

  if (!isReady || !isVisible) {
    return null;
  }

  return (
    <div className="border-b border-black/10 bg-black/[0.035] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <p className="text-sm leading-6 text-black/65 dark:text-white/65">
          This interface currently displays preview content only. All shown metrics, charts,
          activity, balances, and other platform data are illustrative and may differ from the
          final live environment once the product is fully operational.
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss disclaimer"
          className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/70 transition hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.12] dark:hover:text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}