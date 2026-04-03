export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateNonce } from "@/lib/auth";

export async function POST() {
  try {
    const nonce = generateNonce();

    const cookieStore = await cookies();
    cookieStore.set("pmpr_auth_nonce", nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("NONCE ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate nonce." },
      { status: 500 }
    );
  }
}