"use client";

import { useEffect, useState } from "react";

export default function DevDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("dev-disclaimer-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("dev-disclaimer-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-amber-500/90 text-black text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <p className="font-medium">
          ⚠️ This page currently shows simulated preview data only. All displayed information,
metrics, charts, and activity are placeholders and may differ once the platform
is fully live and operational.
        </p>

        <button
          onClick={handleClose}
          className="ml-4 text-black/70 hover:text-black font-semibold"
        >
          ✕
        </button>
      </div>
    </div>
  );
}