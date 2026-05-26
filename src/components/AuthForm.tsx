"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { STORES } from "@/lib/stores";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
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

      window.location.href = "/home";
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "エラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="ナイスプレーシェア"
        description={
          mode === "login"
            ? "店舗を選んでログインしてください。"
            : "店舗を選んで、初回登録を行ってください。"
        }
      />

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
        <div className="space-y-5">
          <label className="block">
            <span className="field-label">店舗</span>
            <select
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              className="field-input"
              required
            >
              <option value="">店舗を選択してください</option>
              {STORES.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">名前</span>
            <input
              type="text"
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
              className="field-input"
              placeholder="例：山田 太郎"
              required
            />
          </label>

          <label className="block">
            <span className="field-label">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input"
              placeholder={mode === "register" ? "6文字以上" : "パスワード"}
              minLength={mode === "register" ? 6 : 1}
              required
            />
          </label>
        </div>

        {error && <p className="alert-error mt-5">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-7">
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </button>
      </form>

      <p className="mt-8 text-center text-[0.875rem] leading-relaxed text-[var(--muted)]">
        {mode === "login" ? (
          <>
            初めての方は{" "}
            <Link href="/register" className="link-accent">
              新規登録
            </Link>
          </>
        ) : (
          <>
            登録済みの方は{" "}
            <Link href="/login" className="link-accent">
              ログイン
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
