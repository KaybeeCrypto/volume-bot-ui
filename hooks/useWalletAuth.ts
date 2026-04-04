"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

type SessionData = {
  address: string;
  authenticatedAt: number;
} | null;

type UseWalletAuthArgs = {
  session: SessionData;
  refreshSession: () => Promise<void>;
  onAuthenticated?: () => void;
};

export function useWalletAuth({
  session,
  refreshSession,
  onAuthenticated,
}: UseWalletAuthArgs) {
  const router = useRouter();
  const { connected, publicKey, signMessage } = useWallet();

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const attemptedAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) {
      attemptedAddressRef.current = null;
      return;
    }

    const address = publicKey.toBase58();

    if (session?.address === address) {
      attemptedAddressRef.current = null;
      return;
    }

    if (attemptedAddressRef.current === address) {
      return;
    }

    attemptedAddressRef.current = address;

    let cancelled = false;

    const authenticate = async () => {
      setAuthLoading(true);
      setAuthError("");

      try {
        const nonceRes = await fetch("/api/auth/nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        if (!nonceRes.ok) {
          throw new Error("Failed to get authentication message.");
        }

        const nonceData = await nonceRes.json();

        if (!nonceData?.message) {
          throw new Error("Authentication message missing.");
        }

        const message = nonceData.message;
        const encodedMessage = new TextEncoder().encode(message);
        const signatureBytes = await signMessage(encodedMessage);
        const signature = bs58.encode(signatureBytes);

        const verifyRes = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            message,
            signature,
          }),
        });

        if (!verifyRes.ok) {
          const verifyText = await verifyRes.text();
          throw new Error(verifyText || "Wallet verification failed.");
        }

        await refreshSession();
        router.refresh();

        if (!cancelled) {
          onAuthenticated?.();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to authenticate wallet.";
        if (!cancelled) {
          setAuthError(message);
        }
        attemptedAddressRef.current = null;
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void authenticate();

    return () => {
      cancelled = true;
    };
  }, [
    connected,
    publicKey,
    signMessage,
    session,
    refreshSession,
    router,
    onAuthenticated,
  ]);

  return { authLoading, authError };
}