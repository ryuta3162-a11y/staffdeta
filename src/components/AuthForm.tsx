"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, staffName, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      router.push("/report");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "エラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-emerald-700">Nice Place Share</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">ナイスプレーシェア</h1>
        <p className="mt-3 text-sm text-slate-600">
          {mode === "login"
            ? "ログインして、今日のナイスプレーを共有しましょう"
            : "初回登録を行ってください"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">店舗名</span>
          <input
            type="text"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="例：渋谷店"
            required
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">名前</span>
          <input
            type="text"
            value={staffName}
            onChange={(event) => setStaffName(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="例：山田 太郎"
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder={mode === "register" ? "6文字以上" : "パスワード"}
            minLength={mode === "register" ? 6 : 1}
            required
          />
        </label>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            初めての方は{" "}
            <Link href="/register" className="font-medium text-emerald-700 underline">
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでに登録済みの方は{" "}
            <Link href="/login" className="font-medium text-emerald-700 underline">
              ログイン
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
