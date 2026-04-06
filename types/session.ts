// types/session.ts

export type SessionStatus =
  | "draft"
  | "awaiting_payment"
  | "payment_detected"
  | "ready_to_start"
  | "starting"
  | "running"
  | "extending_payment_pending"
  | "stopped"
  | "completed"
  | "failed"
  | "expired";

export type Session = {
  id: string;

  // Tier info
  tierKey: string;
  tierName: string;

  // Token
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;

  // Wallet config
  walletCount: number;
  solPerWallet: number;

  // Return wallet
  returnWallet: string;

  // Payment
  paymentAddress?: string;
  paymentAmountSol?: number;
  paymentExpiresAt?: string;

  // Timing
  createdAt: string;
  startedAt?: string;
  endsAt?: string;

  // Status
  status: SessionStatus;

  // Runtime info
  crashCount: number;
  restartCount: number;

  // Result
  returnedSolAmount?: number;
};