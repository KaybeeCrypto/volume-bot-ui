"use client";

import { useEffect, useState } from "react";

export default function DevDisclaimer() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleDismiss() {
    setDismissed(true);
  }

  if (!mounted || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-24 z-20 border-b border-black/10 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <p className="text-sm leading-6 text-black/65 dark:text-white/65">
          This interface currently displays preview content only. All shown metrics,
          charts, activity, balances, and other platform data are illustrative and may
          differ from the final live environment once the product is fully operational.
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-black/70 transition hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/[0.08] dark:text-white/70 dark:hover:bg-white/[0.14] dark:hover:text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}