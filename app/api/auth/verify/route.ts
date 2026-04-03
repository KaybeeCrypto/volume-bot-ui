export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthMessage, verifySolanaSignature } from "@/lib/auth";

type VerifyBody = {
  address: string;
  signature: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const { address, signature } = body;

    if (!address || !signature) {
      return NextResponse.json(
        { error: "Missing address or signature." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const nonce = cookieStore.get("pmpr_auth_nonce")?.value;

    if (!nonce) {
      return NextResponse.json(
        { error: "Missing auth nonce." },
        { status: 400 }
      );
    }

    const domain =
      process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3001";

    const message = createAuthMessage({
      domain,
      address,
      nonce,
      statement: "Sign this message to authenticate with PMPR.",
    });

    const isValid = verifySolanaSignature({
      message,
      signature,
      address,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 401 }
      );
    }

    const sessionPayload = JSON.stringify({
      address,
      authenticatedAt: Date.now(),
    });

    const sessionToken = Buffer.from(sessionPayload).toString("base64url");

    cookieStore.set("pmpr_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.delete("pmpr_auth_nonce");

    return NextResponse.json({ ok: true, address });
  } catch (error) {
    console.error("VERIFY ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}