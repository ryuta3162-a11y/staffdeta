"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface ReportFormProps {
  storeName: string;
  staffName: string;
}

export function ReportForm({ storeName, staffName }: ReportFormProps) {
  const router = useRouter();
  const [impression, setImpression] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("impression", impression);
      formData.append("message", message);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/report", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "送信に失敗しました");
      }

      setImpression("");
      setMessage("");
      handlePhotoChange(null);
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "送信に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Nice Place Share</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">ナイスプレーシェア</h1>
          <p className="mt-2 text-sm text-slate-600">
            {storeName} / {staffName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ログアウト
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">所感</span>
          <textarea
            value={impression}
            onChange={(event) => setImpression(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="今日のナイスプレー、良かった出来事を書いてください"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">写真</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) =>
              handlePhotoChange(event.target.files?.[0] || null)
            }
            className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
          />
          <p className="mt-2 text-xs text-slate-500">任意・5MB以下・スマホから撮影もOK</p>
          {previewUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <Image
                src={previewUrl}
                alt="選択した写真のプレビュー"
                width={800}
                height={600}
                unoptimized
                className="h-auto max-h-80 w-full object-cover"
              />
            </div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">文面</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="共有用の文面を書いてください"
            required
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {success && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            送信しました。管理者のスプレッドシートに反映されます。
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}
