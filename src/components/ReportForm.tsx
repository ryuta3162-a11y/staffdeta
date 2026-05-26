"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { FormSection } from "@/components/FormSection";
import { LogoutButton } from "@/components/LogoutButton";
import { PageHeader } from "@/components/PageHeader";
import { compressImage } from "@/lib/compressImage";

interface ReportFormProps {
  storeName: string;
  staffName: string;
}

async function parseApiResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as { error?: string; success?: boolean };
  } catch {
    if (response.status === 413 || text.includes("Request Entity Too Large")) {
      throw new Error(
        "写真が大きすぎます。別の写真を選ぶか、写真なしで送信してください。",
      );
    }
    throw new Error("送信に失敗しました。時間をおいて再度お試しください。");
  }
}

export function ReportForm({ storeName, staffName }: ReportFormProps) {
  const [report, setReport] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  async function handlePhotoChange(file: File | null) {
    setError("");
    clearPreview();
    setPhoto(null);

    if (!file) {
      return;
    }

    setPhotoLoading(true);
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setError("写真の読み込みに失敗しました。別の写真を選んでください。");
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("report", report);

      if (photo) {
        const compressed = await compressImage(photo);
        formData.append("photo", compressed);
      }

      const response = await fetch("/api/report", {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "送信に失敗しました");
      }

      setReport("");
      clearPreview();
      setPhoto(null);
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
    <div className="w-full">
      <PageHeader
        title="ナイスプレーシェア"
        description="取り組んだことと、出た成果を報告する場所です。"
        meta={
          <>
            <span className="font-medium text-[var(--ink)]">{storeName}</span>
            <span className="text-[var(--border)]">|</span>
            <span>{staffName}</span>
          </>
        }
        action={<LogoutButton />}
      />

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
        <div className="space-y-6">
          <FormSection
            step="①"
            label="アピールポイント"
            hint="どんな取り組みをして、どんな成果が出たかを書いてください"
          >
            <textarea
              value={report}
              onChange={(event) => setReport(event.target.value)}
              className="field-input min-h-44 resize-y leading-relaxed"
              placeholder={
                "例：接客の声かけを増やした結果、お客様から「気持ちよく過ごせた」とお声をいただけました"
              }
              required
            />
          </FormSection>

          <FormSection step="②" label="写真" hint="任意">
            <label className="upload-zone block cursor-pointer px-4 py-5 text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={photoLoading || loading}
                onChange={(event) =>
                  void handlePhotoChange(event.target.files?.[0] || null)
                }
                className="sr-only"
              />
              <span className="text-[0.875rem] font-medium text-[var(--ink)]">
                写真を選ぶ
              </span>
              <span className="mt-1 block text-[0.8125rem] text-[var(--muted)]">
                なくても送信できます
              </span>
            </label>

            {photoLoading && (
              <p className="mt-3 text-center text-[0.8125rem] text-[var(--muted)]">
                写真を準備中...
              </p>
            )}

            {previewUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <Image
                  src={previewUrl}
                  alt="選択した写真のプレビュー"
                  width={800}
                  height={600}
                  unoptimized
                  className="h-auto max-h-72 w-full object-cover"
                />
              </div>
            )}
          </FormSection>
        </div>

        {error && <p className="alert-error mt-6">{error}</p>}
        {success && <p className="alert-success mt-6">送信しました。</p>}

        <button
          type="submit"
          disabled={loading || photoLoading}
          className="btn-primary mt-8"
        >
          {loading ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}
