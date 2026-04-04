"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type SessionLike = {
  address: string;
} | null;

export function useRequireSession(
  sessionLoading: boolean,
  session: SessionLike
) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/");
    }
  }, [sessionLoading, session, router]);
}