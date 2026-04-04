"use client";

import { useCallback, useEffect, useState } from "react";

type SessionData = {
  address: string;
  authenticatedAt: number;
} | null;

export function useAuthSession() {
  const [session, setSession] = useState<SessionData>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      const text = await res.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Session endpoint did not return JSON.");
      }

      setSession(data.session ?? null);
    } catch (error) {
      console.error("SESSION FETCH ERROR:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return { session, loading, refreshSession };
}