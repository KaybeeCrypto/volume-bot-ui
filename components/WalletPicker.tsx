"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

type Props = {
  onSuccess?: () => void;
};

type VerifyResponse = {
  ok?: boolean;
  address?: string;
  error?: string;
};

type NonceResponse = {
  nonce?: string;
  error?: string;
};

export default function WalletPicker({ onSuccess }: Props) {
  const wallet = useWallet();
  const { wallets } = wallet;

  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleWalletLogin = async (walletName: WalletName) => {
    try {
      setError("");
      setLoadingWallet(String(walletName));

      wallet.select(walletName);

      await new Promise((resolve) => setTimeout(resolve, 150));
      await wallet.connect();
      await new Promise((resolve) => setTimeout(resolve, 350));

      const activePublicKey = wallet.publicKey;
      const activeSignMessage = wallet.signMessage;

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
      let nonceData: NonceResponse;

      try {
        nonceData = JSON.parse(nonceText) as NonceResponse;
      } catch {
        throw new Error("Nonce endpoint did not return JSON.");
      }

      if (!nonceRes.ok || !nonceData.nonce) {
        throw new Error(nonceData.error || "Failed to create auth challenge.");
      }

      const nonce = nonceData.nonce;
      const domain = window.location.host;

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
          message,
        }),
      });

      const verifyText = await verifyRes.text();
      let verifyData: VerifyResponse;

      try {
        verifyData = JSON.parse(verifyText) as VerifyResponse;
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