"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { guestEyePaths } from "@/lib/guest-eye/paths";

export function GuestEyeLogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch(guestEyePaths.apiLogout, { method: "POST" });
      window.location.href = guestEyePaths.login;
    } catch {
      setLoading(false);
      router.push(guestEyePaths.login);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className={className || "btn-ghost"}
    >
      {loading ? "..." : "ログアウト"}
    </button>
  );
}
