"use client";

import { useEffect, useRef } from "react";

type TradingViewChartProps = {
  symbol: string;
  height?: number;
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

export default function TradingViewChart({
  symbol,
  height = 520,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9_]/g, "_")}_${Date.now()}`;

    const widgetContainer = document.createElement("div");
    widgetContainer.id = containerId;
    widgetContainer.className = "h-full w-full";

    containerRef.current.appendChild(widgetContainer);

    const createWidget = () => {
      if (!window.TradingView) return;

      new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        support_host: "https://www.tradingview.com",
        container_id: containerId,
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript && window.TradingView) {
      createWidget();
      return () => {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      };
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      createWidget();
    };

    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}