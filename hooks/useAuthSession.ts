"use client";

import { useEffect, useState } from "react";

type SessionData = {
  address: string;
  authenticatedAt: number;
} | null;

export function useAuthSession() {
  const [session, setSession] = useState<SessionData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/session")
      .then(async (res) => {
        const text = await res.text();

        try {
          return JSON.parse(text);
        } catch {
          throw new Error("Session endpoint did not return JSON.");
        }
      })
      .then((data) => {
        if (mounted) {
          setSession(data.session ?? null);
        }
      })
      .catch((error) => {
        console.error("SESSION FETCH ERROR:", error);
        if (mounted) {
          setSession(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { session, loading };
}