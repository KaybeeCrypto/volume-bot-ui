"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

type Props = {
  onSuccess?: () => void;
};

export default function WalletPicker({ onSuccess }: Props) {
  const {
    wallets,
    select,
    connect,
    connected,
    publicKey,
    signMessage,
  } = useWallet();

  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleWalletLogin = async (walletName: WalletName) => {
    try {
      setError("");
      setLoadingWallet(String(walletName));

      select(walletName);

      // small delay to allow adapter state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      await connect();

      // wait a moment for publicKey/signMessage to become available
      await new Promise((resolve) => setTimeout(resolve, 300));

      const activePublicKey = publicKey;
      const activeSignMessage = signMessage;

      if (!activePublicKey) {
        throw new Error("Wallet connected but public key is missing.");
      }

      if (!activeSignMessage) {
        throw new Error("This wallet does not support message signing.");
      }

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
      });

      const nonceText = await nonceRes.text();
      let nonceData: any;

      try {
        nonceData = JSON.parse(nonceText);
      } catch {
        throw new Error("Nonce endpoint did not return JSON.");
      }

      if (!nonceRes.ok) {
        throw new Error(nonceData.error || "Failed to create auth challenge.");
      }

      const { nonce } = nonceData;

      const domain =
        process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.host;

      const message =
        `${domain} wants you to sign in with your Solana account:\n` +
        `${activePublicKey.toBase58()}\n\n` +
        `Sign this message to authenticate with PMPR.\n\n` +
        `Nonce: ${nonce}`;

      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await activeSignMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: activePublicKey.toBase58(),
          signature,
        }),
      });

      const verifyText = await verifyRes.text();
      let verifyData: any;

      try {
        verifyData = JSON.parse(verifyText);
      } catch {
        throw new Error("Verify endpoint did not return JSON.");
      }

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Authentication failed.");
      }

      onSuccess?.();
      window.location.href = "/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoadingWallet(null);
    }
  };

  const phantom = wallets.find((w) => w.adapter.name === "Phantom");
  const solflare = wallets.find((w) => w.adapter.name === "Solflare");

  return (
    <div className="flex flex-col items-center gap-4">
      {phantom && (
        <button
          onClick={() => handleWalletLogin(phantom.adapter.name)}
          disabled={!!loadingWallet}
          className="w-full max-w-[260px] rounded-xl bg-[#6C47FF] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loadingWallet === phantom.adapter.name
            ? "Connecting Phantom..."
            : "Continue with Phantom"}
        </button>
      )}

      {solflare && (
        <button
          onClick={() => handleWalletLogin(solflare.adapter.name)}
          disabled={!!loadingWallet}
          className="w-full max-w-[260px] rounded-xl border border-black px-5 py-3 font-semibold text-black transition hover:bg-gray-100 disabled:opacity-60"
        >
          {loadingWallet === solflare.adapter.name
            ? "Connecting Solflare..."
            : "Continue with Solflare"}
        </button>
      )}

      {error ? (
        <p className="max-w-[320px] text-center text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}