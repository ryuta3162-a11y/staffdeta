"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StorePicker } from "@/components/guest-eye/StorePicker";
import { guestEyePaths } from "@/lib/guest-eye/paths";
import { loadSavedAuth, saveSavedAuth } from "@/lib/guest-eye/savedLogin";
import type { StoreRecord } from "@/lib/guest-eye/stores";

type LookupStatus = "idle" | "new" | "needsSetup" | "needsStore" | "existing";

interface LookupResult {
  status: LookupStatus;
  message?: string;
  stores?: string[];
  savedPassword?: string;
}

export function GuestEyeAuthForm() {
  const [staffName, setStaffName] = useState("");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [lookup, setLookup] = useState<LookupResult>({ status: "idle" });
  const [showEditRegistration, setShowEditRegistration] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);

  const registeredStores = lookup.stores || [];
  const isExistingUser = lookup.status === "existing";
  const showLoginForm = isExistingUser && !showEditRegistration;
  const showRegistrationForm =
    lookup.status === "new" ||
    lookup.status === "needsSetup" ||
    lookup.status === "needsStore" ||
    showEditRegistration;

  useEffect(() => {
    const saved = loadSavedAuth();
    if (!saved) {
      return;
    }

    setStaffName(saved.staffName);
    setPassword(saved.password);
  }, []);

  useEffect(() => {
    const trimmed = staffName.trim();
    if (!trimmed || !password) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveSavedAuth({ staffName: trimmed, password });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [staffName, password]);

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
      setShowEditRegistration(false);
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

      const status = data.status as LookupStatus;
      setLookup({
        status,
        message: data.message,
        stores: data.stores,
      });
      setShowEditRegistration(false);

      if (status === "existing") {
        const registered = data.stores || [];
        setSelectedStores(registered.length === 1 ? [registered[0]] : []);
      } else {
        setSelectedStores([]);
      }

      if (data.savedPassword) {
        setPassword(data.savedPassword);
        saveSavedAuth({ staffName: trimmed, password: data.savedPassword });
      }
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
      setShowEditRegistration(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runLookup(trimmed);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [staffName, runLookup]);

  function selectLoginStore(store: string) {
    setSelectedStores([store]);
  }

  async function submitAuth(authMode: "login" | "register", storeNames: string[]) {
    const trimmedName = staffName.trim();
    const response = await fetch(guestEyePaths.apiAuth(authMode), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeNames: authMode === "register" ? storeNames : undefined,
        storeName: storeNames[0],
        staffName: trimmedName,
        password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "エラーが発生しました");
    }

    saveSavedAuth({ staffName: trimmedName, password });
    window.location.href = guestEyePaths.home;
  }

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedName = staffName.trim();
      if (!trimmedName) {
        throw new Error("名前を入力してください");
      }
      if (!password) {
        throw new Error("パスワードを入力してください");
      }
      if (selectedStores.length !== 1) {
        throw new Error("ログインする店舗を1つ選んでください");
      }
      if (!registeredStores.includes(selectedStores[0])) {
        throw new Error("登録済みの店舗を選んでください");
      }

      await submitAuth("login", selectedStores);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "エラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedName = staffName.trim();
      if (!trimmedName) {
        throw new Error("名前を入力してください");
      }
      if (selectedStores.length === 0) {
        throw new Error("所属店舗を1つ以上選んでください");
      }
      if (!password || password.length < 6) {
        throw new Error("パスワードは6文字以上で入力してください");
      }

      await submitAuth("register", selectedStores);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "エラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }

  const pageDescription = showLoginForm
    ? "登録済みの方は、店舗とパスワードを選んで再度ログインしてください。"
    : "名前を入力してから、所属店舗とパスワードを選んでください。";

  return (
    <div className="w-full">
      <PageHeader
        badge="Guest Eye"
        title="ゲストアイ"
        description={pageDescription}
      />

      {showLoginForm ? (
        <form onSubmit={handleLoginSubmit} className="guest-eye-panel">
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

            {lookupLoading && <p className="guest-eye-muted">確認中...</p>}

            <section>
              <h3 className="store-filter-title">ログインする店舗（必須）</h3>
              <p className="store-filter-hint mb-3">
                下の店舗名を1つタップして青くしてから、「再度ログイン」を押してください。
              </p>
              <div className="store-filter-chips">
                {registeredStores.map((store) => (
                  <button
                    key={store}
                    type="button"
                    disabled={loading}
                    className={`store-filter-chip ${selectedStores.includes(store) ? "store-filter-chip--on" : ""}`}
                    onClick={() => {
                      selectLoginStore(store);
                      setError("");
                    }}
                  >
                    {store}
                  </button>
                ))}
              </div>
              {!lookupLoading &&
                registeredStores.length > 0 &&
                selectedStores.length === 0 && (
                  <p className="alert-info mt-3">店舗が未選択です。1つタップしてください。</p>
                )}
            </section>

            <label className="block">
              <span className="field-label">パスワード</span>
              <input
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input"
                placeholder="パスワード"
                autoComplete="off"
                required
              />
            </label>
          </div>

          {error && <p className="alert-error guest-eye-panel-alert">{error}</p>}

          <button
            type="submit"
            disabled={loading || lookupLoading || !password.trim()}
            className="btn-primary guest-eye-panel-submit"
          >
            {loading ? "処理中..." : "再度ログイン"}
          </button>

          <button
            type="button"
            disabled={loading || lookupLoading}
            className="btn-ghost guest-eye-panel-submit mt-3 w-full"
            onClick={() => {
              setShowEditRegistration(true);
              setError("");
              setSelectedStores([]);
            }}
          >
            登録情報を変更する
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="guest-eye-panel">
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

            {lookupLoading && <p className="guest-eye-muted">確認中...</p>}

            {(lookup.status === "needsSetup" || lookup.status === "needsStore") &&
              lookup.message && <p className="alert-info">{lookup.message}</p>}

            {showRegistrationForm && !storesLoading && (
              <>
                <StorePicker
                  stores={stores}
                  selectedStores={selectedStores}
                  registeredStores={registeredStores}
                  onStoresChange={setSelectedStores}
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
                      lookup.status === "new" ||
                      lookup.status === "needsSetup" ||
                      (lookup.status === "needsStore" && !password)
                        ? "6文字以上で設定"
                        : "6文字以上"
                    }
                    autoComplete="off"
                    minLength={6}
                    required
                  />
                </label>
              </>
            )}

            {storesLoading && staffName.trim() && (
              <p className="guest-eye-muted">店舗データを読み込み中...</p>
            )}
          </div>

          {error &&
            lookup.status !== "needsSetup" &&
            lookup.status !== "needsStore" && (
              <p className="alert-error guest-eye-panel-alert">{error}</p>
            )}

          {showRegistrationForm && lookup.status !== "idle" && !lookupLoading && (
            <button
              type="submit"
              disabled={
                loading ||
                storesLoading ||
                lookupLoading ||
                selectedStores.length === 0 ||
                !password
              }
              className="btn-primary guest-eye-panel-submit"
            >
              {loading
                ? "処理中..."
                : showEditRegistration
                  ? selectedStores.length > 1
                    ? `${selectedStores.length}店舗を登録する`
                    : "登録情報を更新する"
                  : selectedStores.length > 1
                    ? `${selectedStores.length}店舗を登録する`
                    : "登録する"}
            </button>
          )}

          {showEditRegistration && (
            <button
              type="button"
              disabled={loading}
              className="btn-ghost guest-eye-panel-submit mt-3 w-full"
              onClick={() => {
                setShowEditRegistration(false);
                setError("");
                setSelectedStores(
                  registeredStores.length === 1 ? [registeredStores[0]] : [],
                );
              }}
            >
              ログイン画面に戻る
            </button>
          )}
        </form>
      )}
    </div>
  );
}
