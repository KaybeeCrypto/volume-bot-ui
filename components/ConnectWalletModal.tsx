"use client";

import WalletPicker from "@/components/WalletPicker";

type ConnectWalletModalProps = {
  open: boolean;
  onClose: () => void;
  authLoading?: boolean;
  authError?: string;
};

export default function ConnectWalletModal({
  open,
  onClose,
  authLoading = false,
  authError = "",
}: ConnectWalletModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/60 bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Wallet Access
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-black">
              Connect Wallet
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-lg leading-none text-gray-400 transition hover:bg-gray-100 hover:text-black"
            aria-label="Close wallet modal"
          >
            ×
          </button>
        </div>

        <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
          Connect your wallet to access the dashboard and start your session
          flow.
        </p>

        <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <WalletPicker />
        </div>

        {authLoading && (
          <div className="mt-4 text-sm text-gray-500">
            Waiting for wallet signature...
          </div>
        )}

        {authError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {authError}
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-cyan-500" />
          <p className="text-xs leading-5 text-gray-600">
            Use a supported Solana wallet like Phantom or Solflare. Your wallet
            remains under your control during connection.
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          By connecting, you agree to your app’s access flow and wallet-based
          authentication.
        </p>
      </div>
    </div>
  );
}