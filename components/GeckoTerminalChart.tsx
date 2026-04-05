"use client";

type GeckoTerminalChartProps = {
  /**
   * Use either "pools" or "tokens".
   * Pools are usually the safest choice if you already know the exact pool address.
   */
  mode?: "pools" | "tokens";

  /**
   * Solana pool address or token contract address,
   * depending on the selected mode.
   */
  address: string;

  /**
   * Chart height in px.
   */
  height?: number;

  /**
   * "price" or "market_cap"
   */
  chartType?: "price" | "market_cap";

  /**
   * Common GeckoTerminal resolutions like 1m, 5m, 15m, 1h, 4h, 1d
   */
  resolution?: string;

  /**
   * false = dark chart
   * true = light chart
   */
  lightChart?: boolean;

  /**
   * Show token/pair info panel
   */
  showInfo?: boolean;

  /**
   * Show recent swaps panel
   */
  showSwaps?: boolean;

  /**
   * Background color without "#", for example "ffffff" or "111827"
   */
  bgColor?: string;

  className?: string;
};

export default function GeckoTerminalChart({
  mode = "tokens",
  address,
  height = 560,
  chartType = "price",
  resolution = "15m",
  lightChart = true,
  showInfo = false,
  showSwaps = false,
  bgColor = "ffffff",
  className = "",
}: GeckoTerminalChartProps) {
  const src =
    `https://www.geckoterminal.com/solana/${mode}/${address}` +
    `?embed=1` +
    `&info=${showInfo ? 1 : 0}` +
    `&swaps=${showSwaps ? 1 : 0}` +
    `&light_chart=${lightChart ? 1 : 0}` +
    `&chart_type=${chartType}` +
    `&resolution=${encodeURIComponent(resolution)}` +
    `&bg_color=${bgColor}`;

  return (
    <div
        className={`w-full overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-950 ${className}`}
        style={{ height }}
      >
      <iframe
        title="GeckoTerminal Solana Chart"
        src={src}
        className="h-full w-full border-0"
        allow="clipboard-write"
        allowFullScreen
      />
    </div>
  );
}