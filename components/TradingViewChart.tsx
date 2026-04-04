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

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget h-full w-full";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright";

    const link = document.createElement("a");
    link.href = `https://www.tradingview.com/symbols/${encodeURIComponent(symbol)}/`;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    link.innerHTML = `<span class="blue-text">${symbol} chart</span> by TradingView`;

    copyright.appendChild(link);

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(copyright);

    const createWidget = () => {
      if (!window.TradingView || !widgetContainer) return;

      new window.TradingView.widget({
        autosize: true,
        symbol,
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
        container: widgetContainer,
        support_host: "https://www.tradingview.com",
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript && window.TradingView) {
      createWidget();
      return;
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
      className="tradingview-widget-container w-full overflow-hidden rounded-2xl border border-black/10"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}