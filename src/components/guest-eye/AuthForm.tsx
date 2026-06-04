"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StorePicker } from "@/components/guest-eye/StorePicker";
import { guestEyePaths } from "@/lib/guest-eye/paths";
import { loadSavedName, saveSavedName } from "@/lib/guest-eye/savedLogin";
import type { StoreRecord } from "@/lib/guest-eye/stores";

type LookupStatus = "idle" | "new" | "needsSetup" | "existing";

interface LookupResult {
  status: LookupStatus;
  message?: string;
  stores?: string[];
}

export function GuestEyeAuthForm() {
  const [staffName, setStaffName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [lookup, setLookup] = useState<LookupResult>({ status: "idle" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);

  const showStoreFields =
    lookup.status === "new" ||
    lookup.status === "needsSetup" ||
    lookup.status === "existing";

  useEffect(() => {
    setStaffName(loadSavedName());
  }, []);

  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch(guestEyePaths.apiStores);
        const data = (await response.json()) as {
          stores?: StoreRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "店舗データの取得に失敗しました");
        }
        setStores(data.stores || []);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "店舗データの取得に失敗しました",
        );
      } finally {
        setStoresLoading(false);
      }
    }

    void fetchStores();
  }, []);

  const runLookup = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setLookup({ status: "idle" });
      return;
    }

    setLookupLoading(true);
    setError("");

    try {
      const response = await fetch(guestEyePaths.apiStaffLookup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffName: trimmed }),
      });
      const data = (await response.json()) as LookupResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "確認に失敗しました");
      }

      setLookup({
        status: data.status,
        message: data.message,
        stores: data.stores,
      });
    } catch (lookupError) {
      setLookup({ status: "idle" });
      setError(
        lookupError instanceof Error ? lookupError.message : "確認に失敗しました",
      );
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = staffName.trim();
    if (!trimmed) {
      setLookup({ status: "idle" });
      return;
    }

    const timer = window.setTimeout(() => {
      void runLookup(trimmed);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [staffName, runLookup]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = staffName.trim();
    if (!trimmedName) {
      setError("名前を入力してください");
      setLoading(false);
      return;
    }

    if (!storeName) {
      setError("所属店舗を選択してください");
      setLoading(false);
      return;
    }

    const isRegister =
      lookup.status === "new" ||
      lookup.status === "needsSetup" ||
      (lookup.status === "existing" &&
        !(lookup.stores || []).includes(storeName));
    const authMode = isRegister ? "register" : "login";

    try {
      const response = await fetch(guestEyePaths.apiAuth(authMode), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          staffName: trimmedName,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      saveSavedName(trimmedName);
      window.location.href = guestEyePaths.home;
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
        badge="Guest Eye"
        title="ゲストアイ"
        description="名前を入力してから、所属店舗とパスワードを選んでください。"
      />

      <form onSubmit={handleSubmit} className="guest-eye-panel">
        <div className="space-y-5">
          <label className="block">
            <span className="field-label">名前</span>
            <input
              type="text"
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
              className="field-input"
              placeholder="例：山田 太郎"
              autoComplete="name"
              required
            />
          </label>

          {lookupLoading && (
            <p className="guest-eye-muted">確認中...</p>
          )}

          {lookup.status === "needsSetup" && lookup.message && (
            <p className="alert-info">{lookup.message}</p>
          )}

          {showStoreFields && !storesLoading && (
            <>
              <StorePicker
                stores={stores}
                storeName={storeName}
                registeredStores={lookup.stores || []}
                onStoreChange={setStoreName}
                disabled={loading}
              />

              <label className="block">
                <span className="field-label">パスワード</span>
                <input
                  type="text"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field-input"
                  placeholder={
                    lookup.status === "new" || lookup.status === "needsSetup"
                      ? "6文字以上で設定"
                      : "パスワード"
                  }
                  autoComplete="off"
                  minLength={
                    lookup.status === "new" || lookup.status === "needsSetup"
                      ? 6
                      : 1
                  }
                  required
                />
              </label>
            </>
          )}

          {storesLoading && staffName.trim() && (
            <p className="guest-eye-muted">店舗データを読み込み中...</p>
          )}
        </div>

        {error && lookup.status !== "needsSetup" && (
          <p className="alert-error guest-eye-panel-alert">{error}</p>
        )}

        {showStoreFields && (
          <button
            type="submit"
            disabled={loading || storesLoading || lookupLoading}
            className="btn-primary guest-eye-panel-submit"
          >
            {loading
              ? "処理中..."
              : lookup.status === "new" || lookup.status === "needsSetup"
                ? "登録する"
                : "ログイン"}
          </button>
        )}
      </form>
    </div>
  );
}
