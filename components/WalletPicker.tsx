"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";

type WalletPickerProps = {
  onSuccess?: () => void;
};

type SupportedWalletName = "Phantom" | "Solflare";

export default function WalletPicker({ onSuccess }: WalletPickerProps) {
  const {
    wallets,
    wallet,
    connected,
    connecting,
    disconnecting,
    select,
    connect,
  } = useWallet();

  const [pendingWallet, setPendingWallet] = useState<SupportedWalletName | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (connected && onSuccess) {
      onSuccess();
    }
  }, [connected, onSuccess]);

  const supportedWallets = useMemo(() => {
    const names: SupportedWalletName[] = ["Phantom", "Solflare"];

    return names
      .map((name) =>
        wallets.find((walletEntry) => walletEntry.adapter.name === name)
      )
      .filter(Boolean);
  }, [wallets]);

  const handleConnect = async (walletName: SupportedWalletName) => {
    setError("");
    setPendingWallet(walletName);

    try {
      const targetWallet = wallets.find(
        (walletEntry) => walletEntry.adapter.name === walletName
      );

      if (!targetWallet) {
        throw new Error(`${walletName} wallet is not available.`);
      }

      if (targetWallet.readyState === WalletReadyState.Unsupported) {
        throw new Error(`${walletName} is not supported in this browser.`);
      }

      if (targetWallet.readyState === WalletReadyState.NotDetected) {
        throw new Error(
          `${walletName} is not installed or not detected in this browser.`
        );
      }

      if (wallet?.adapter.name !== walletName) {
        select(targetWallet.adapter.name);
      }

      await connect();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet.";
      setError(message);
      setPendingWallet(null);
    }
  };

  useEffect(() => {
    if (!connecting && !disconnecting && !connected) {
      setPendingWallet(null);
    }
  }, [connecting, disconnecting, connected]);

  return (
    <div className="flex w-full flex-col gap-3">
      {supportedWallets.map((walletEntry) => {
        const walletName = walletEntry!.adapter.name as SupportedWalletName;
        const isPending =
          pendingWallet === walletName || (connecting && wallet?.adapter.name === walletName);

        const installed =
          walletEntry!.readyState === WalletReadyState.Installed ||
          walletEntry!.readyState === WalletReadyState.Loadable;

        const isPhantom = walletName === "Phantom";

        return (
          <button
            key={walletName}
            type="button"
            onClick={() => void handleConnect(walletName)}
            disabled={isPending || connecting}
            className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
              isPhantom
                ? "border-transparent bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] hover:opacity-95"
                : "border-gray-200 bg-white text-black hover:bg-gray-50"
            } ${isPending ? "cursor-not-allowed opacity-80" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl ${
                  isPhantom ? "bg-white/12" : "bg-gray-100"
                }`}
              >
                <img
                  src={walletEntry!.adapter.icon}
                  alt={`${walletName} logo`}
                  className="h-6 w-6 object-contain"
                />
              </div>

              <div>
                <p
                  className={`text-sm font-semibold ${
                    isPhantom ? "text-white" : "text-black"
                  }`}
                >
                  {isPending ? `Connecting ${walletName}...` : `Continue with ${walletName}`}
                </p>

                <p
                  className={`mt-1 text-xs ${
                    isPhantom ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {installed ? "Detected in browser" : "Not detected"}
                </p>
              </div>
            </div>

            <span
              className={`text-lg transition group-hover:translate-x-1 ${
                isPhantom ? "text-white/70" : "text-gray-400"
              }`}
            >
              {isPending ? "…" : "→"}
            </span>
          </button>
        );
      })}

      {supportedWallets.length === 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No supported wallets were found. Make sure Phantom or Solflare is available in your wallet adapter setup.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}