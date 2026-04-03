"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletStatus() {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return null;
  }

  const walletAddress = publicKey.toBase58();
  const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  return (
    <p className="text-sm text-gray-500">
      Connected wallet:{" "}
      <span className="font-semibold text-black">{shortAddress}</span>
    </p>
  );
}