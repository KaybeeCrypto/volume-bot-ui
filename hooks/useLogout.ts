"use client";

import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return { handleLogout };
}