"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

type Props = {
  onSuccess?: () => void;
};

export default function SignInWithWalletButton({ onSuccess }: Props) {
  const { publicKey, connected, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    try {
      setError("");

      if (!connected || !publicKey) {
        setError("Connect your wallet first.");
        return;
      }

      if (!signMessage) {
        setError("This wallet does not support message signing.");
        return;
      }

      setLoading(true);

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
      });

      const nonceText = await nonceRes.text();
      let nonceData: any;

      try {
        nonceData = JSON.parse(nonceText);
      } catch {
        throw new Error(
          `Nonce endpoint did not return JSON: ${nonceText.slice(0, 120)}`
        );
      }

      if (!nonceRes.ok) {
        throw new Error(nonceData.error || "Failed to create auth challenge.");
      }

      const { nonce } = nonceData;

      const domain =
        process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.host;

      const message =
        `${domain} wants you to sign in with your Solana account:\n` +
        `${publicKey.toBase58()}\n\n` +
        `Sign this message to authenticate with PMPR.\n\n` +
        `Nonce: ${nonce}`;

      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: publicKey.toBase58(),
          signature,
        }),
      });

      const verifyText = await verifyRes.text();
      let verifyData: any;

      try {
        verifyData = JSON.parse(verifyText);
      } catch {
        throw new Error(
          `Verify endpoint did not return JSON: ${verifyText.slice(0, 120)}`
        );
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
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full rounded-xl border border-black py-3 font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing In..." : "Sign In With Wallet"}
      </button>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}