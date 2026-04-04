export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateNonce } from "@/lib/auth";

type NonceBody = {
  address?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NonceBody;
    const address = body.address?.trim();

    if (!address) {
      return NextResponse.json(
        { error: "Missing wallet address." },
        { status: 400 }
      );
    }

    const nonce = generateNonce();

    const message = [
      "Sign this message to authenticate with PMPR.",
      `Address: ${address}`,
      `Nonce: ${nonce}`,
    ].join("\n");

    const cookieStore = await cookies();
    cookieStore.set("pmpr_auth_nonce", nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return NextResponse.json({ nonce, message });
  } catch (error) {
    console.error("NONCE ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate nonce." },
      { status: 500 }
    );
  }
}