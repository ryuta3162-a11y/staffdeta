"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GuestEyeLogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/guest-eye/api/auth/logout", { method: "POST" });
      window.location.href = "/guest-eye/login";
    } catch {
      setLoading(false);
      router.push("/guest-eye/login");
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
