"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setLoading(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className={
        className ||
        "rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      }
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
