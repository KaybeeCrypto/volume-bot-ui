export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({ session });
  } catch (error) {
    console.error("SESSION ROUTE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load session." },
      { status: 500 }
    );
  }
}