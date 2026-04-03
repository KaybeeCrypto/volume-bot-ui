"use client";

import dynamic from "next/dynamic";

const WalletModalButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletModalButton,
  { ssr: false }
);

export default function ConnectWalletButton() {
  return <WalletModalButton />;
}