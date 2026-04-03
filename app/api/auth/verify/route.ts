export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySolanaSignature } from "@/lib/auth";

type VerifyBody = {
  address: string;
  signature: string;
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const { address, signature, message } = body;

    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: "Missing address, signature, or message." },
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

    if (!message.includes(`Nonce: ${nonce}`)) {
      return NextResponse.json(
        { error: "Auth message nonce mismatch." },
        { status: 401 }
      );
    }

    if (!message.includes(address)) {
      return NextResponse.json(
        { error: "Auth message address mismatch." },
        { status: 401 }
      );
    }

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