"use client";

import { useRouter } from "next/navigation";

type UseLogoutOptions = {
  onLoggedOut?: () => Promise<void> | void;
};

export function useLogout(options?: UseLogoutOptions) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      await options?.onLoggedOut?.();
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return { handleLogout };
}