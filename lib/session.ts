import { cookies } from "next/headers";

export type SessionData = {
  address: string;
  authenticatedAt: number;
};

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("pmpr_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}