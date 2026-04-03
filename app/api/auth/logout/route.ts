export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("pmpr_session");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LOGOUT ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to logout." },
      { status: 500 }
    );
  }
}