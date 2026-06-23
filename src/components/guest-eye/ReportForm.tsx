"use client";

import Image from "next/image";
import { FormEvent, type ReactNode, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GuestEyeLogoutButton } from "@/components/guest-eye/LogoutButton";
import { StarRating } from "@/components/guest-eye/StarRating";
import { compressImage } from "@/lib/compressImage";
import { guestEyePaths } from "@/lib/guest-eye/paths";
import { EMPLOYEE_PROGRAM_STORE } from "@/lib/guest-eye/stores";

interface ReportFormProps {
  storeName: string;
  storeNames: string[];
  staffName: string;
}

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 5;

function FormSection({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="guest-eye-section">
      <h2 className="guest-eye-section-title">
        <span className="guest-eye-section-step">{step}</span>
        {title}
      </h2>
      {hint && <p className="guest-eye-section-hint">{hint}</p>}
      <div className="guest-eye-section-body">{children}</div>
    </section>
  );
}

async function parseApiResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as { error?: string; success?: boolean };
  } catch {
    if (response.status === 413 || text.includes("Request Entity Too Large")) {
      throw new Error(
        "写真が大きすぎます。枚数を減らすか、写真なしで送信してください。",
      );
    }
    throw new Error("送信に失敗しました。時間をおいて再度お試しください。");
  }
}

export function GuestEyeReportForm({
  storeName,
  storeNames,
  staffName,
}: ReportFormProps) {
  const [activeStore, setActiveStore] = useState(storeName || storeNames[0] || "");
  const hasEmployeeProgram = storeNames.includes(EMPLOYEE_PROGRAM_STORE);
  const onlyEmployeeProgram =
    storeNames.length === 1 && hasEmployeeProgram;
  const postTargetTitle = onlyEmployeeProgram
    ? "投稿するプログラム"
    : hasEmployeeProgram
      ? "投稿する店舗・プログラム"
      : "投稿する店舗";
  const [impression, setImpression] = useState("");
  const [healthRating, setHealthRating] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  function revokePhotos(items: PhotoItem[]) {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }

  function clearPhotos() {
    revokePhotos(photos);
    setPhotos([]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function addPhotos(files: FileList | File[]) {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (fileArray.length === 0) {
      setError("画像ファイルを選択してください");
      return;
    }

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`写真は最大${MAX_PHOTOS}枚まで添付できます`);
      return;
    }

    const selected = fileArray.slice(0, remaining);
    if (fileArray.length > remaining) {
      setError(`写真は最大${MAX_PHOTOS}枚までです。${remaining}枚だけ追加しました`);
    } else {
      setError("");
    }

    setPhotoLoading(true);
    try {
      const newItems: PhotoItem[] = [];
      for (const file of selected) {
        const compressed = await compressImage(file);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        });
      }
      setPhotos((current) => [...current, ...newItems]);
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

    if (healthRating < 1) {
      setError("星の評価をタップして選択してください");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("storeName", activeStore);
      formData.append("impression", impression);
      formData.append("healthRating", String(healthRating));

      for (const item of photos) {
        const compressed = await compressImage(item.file);
        formData.append("photos", compressed);
      }

      const response = await fetch(guestEyePaths.apiReport, {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "送信に失敗しました");
      }

      setImpression("");
      setHealthRating(0);
      clearPhotos();
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
        badge="Guest Eye"
        title="ゲストアイ"
        description="施設利用中の気づきを、お客様目線で共有してください。"
        meta={
          <>
            <span className="font-bold text-[var(--ink)]">{activeStore}</span>
            <span className="font-bold text-[var(--accent)]">|</span>
            <span>{staffName}</span>
          </>
        }
        action={<GuestEyeLogoutButton />}
      />

      {storeNames.length > 0 && (
        <section className="guest-eye-panel mb-4">
          <h3 className="store-filter-title">{postTargetTitle}</h3>
          <p className="store-filter-hint mb-3">
            {storeNames.length > 1
              ? "投稿先を選んでから送信してください"
              : "この店舗宛に所感を送信します。"}
          </p>
          <div className="store-filter-chips">
            {storeNames.map((name) => (
              <button
                key={name}
                type="button"
                className={`store-filter-chip ${activeStore === name ? "store-filter-chip--on" : ""}`}
                onClick={() => setActiveStore(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="guest-eye-panel">
        <FormSection
          step="1"
          title="お客様目線の気づき"
          hint="施設利用中の気づきをお客様目線で率直に書いてください"
        >
          <textarea
            value={impression}
            onChange={(event) => setImpression(event.target.value)}
            className="field-input min-h-44 resize-y leading-relaxed"
            placeholder="例：ストレッチエリア利用中に、スタッフの接客が丁寧で印象に残りました"
            required
          />
        </FormSection>

        <FormSection
          step="2"
          title="写真"
          hint="画像を添付してください"
        >
          <div className="upload-actions">
            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={photoLoading || loading || photos.length >= MAX_PHOTOS}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void addPhotos([file]);
                  }
                  event.target.value = "";
                }}
                className="sr-only"
              />
              <span className="upload-btn-title">カメラで撮影</span>
              <span className="upload-btn-desc">1枚ずつ追加</span>
            </label>

            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={photoLoading || loading || photos.length >= MAX_PHOTOS}
                onChange={(event) => {
                  if (event.target.files?.length) {
                    void addPhotos(event.target.files);
                  }
                  event.target.value = "";
                }}
                className="sr-only"
              />
              <span className="upload-btn-title">画像を添付</span>
              <span className="upload-btn-desc">フォトから選択</span>
            </label>
          </div>

          <p className="guest-eye-muted mt-3 text-center">
            最大{MAX_PHOTOS}枚（{photos.length}/{MAX_PHOTOS}）
          </p>

          {photoLoading && (
            <p className="guest-eye-muted mt-3 text-center">写真を準備中...</p>
          )}

          {photos.length > 0 && (
            <div className="photo-grid mt-4">
              {photos.map((item) => (
                <div key={item.id} className="photo-preview">
                  <Image
                    src={item.previewUrl}
                    alt="選択した写真"
                    width={400}
                    height={300}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(item.id)}
                    className="photo-remove"
                    aria-label="写真を削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <FormSection
          step="3"
          title="施設利用が達成感や健康づくりに繋がっていますか？"
        >
          <StarRating
            value={healthRating}
            onChange={setHealthRating}
            disabled={loading}
            name="健康・達成感の評価"
          />
        </FormSection>

        {error && <p className="alert-error guest-eye-panel-alert">{error}</p>}
        {success && <p className="alert-success guest-eye-panel-alert">送信しました。</p>}

        <button
          type="submit"
          disabled={loading || photoLoading}
          className="btn-primary guest-eye-panel-submit"
        >
          {loading ? "送信中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
