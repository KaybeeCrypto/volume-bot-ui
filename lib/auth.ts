import nacl from "tweetnacl";
import bs58 from "bs58";
import crypto from "crypto";

export function generateNonce() {
  return crypto.randomBytes(24).toString("hex");
}

export function createAuthMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  statement?: string;
}) {
  const { domain, address, nonce, statement } = params;

  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    statement || "Sign this message to authenticate with PMPR.",
    "",
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function verifySolanaSignature(params: {
  message: string;
  signature: string;
  address: string;
}) {
  const { message, signature, address } = params;

  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = bs58.decode(address);

  return nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
}