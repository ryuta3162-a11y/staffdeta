"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GuestEyeLogoutButton } from "@/components/guest-eye/LogoutButton";
import { StarRating } from "@/components/guest-eye/StarRating";
import { compressImage } from "@/lib/compressImage";
import { guestEyePaths } from "@/lib/guest-eye/paths";

interface ReportFormProps {
  storeName: string;
  staffName: string;
}

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 5;

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

export function GuestEyeReportForm({ storeName, staffName }: ReportFormProps) {
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
      setError("健康・達成感の評価を選択してください");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
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
            <span className="font-bold text-[var(--ink)]">{storeName}</span>
            <span className="font-bold text-[var(--accent)]">|</span>
            <span>{staffName}</span>
          </>
        }
        action={<GuestEyeLogoutButton />}
      />

      <form onSubmit={handleSubmit} className="guest-eye-review-form">
        <div className="guest-eye-review-section">
          <p className="guest-eye-review-label">① お客様目線の気づき</p>
          <p className="guest-eye-review-hint">
            施設利用中の気づきをお客様目線で率直に書いてください。（清掃、設備の故障、スタッフの接客など・・・）
          </p>
          <textarea
            value={impression}
            onChange={(event) => setImpression(event.target.value)}
            className="guest-eye-review-textarea field-input w-full"
            placeholder="例：ストレッチエリア利用中に、スタッフの接客が丁寧で印象に残りました"
            required
          />
        </div>

        <div className="guest-eye-review-section">
          <p className="guest-eye-review-label">② 写真</p>
          <p className="guest-eye-review-hint">
            清掃や設備の不具合など、伝えたいことがあれば画像を添付してください
          </p>

          <div className="upload-actions mt-3">
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

          <p className="mt-3 text-center text-[0.8125rem] font-medium text-[var(--muted)]">
            最大{MAX_PHOTOS}枚（{photos.length}/{MAX_PHOTOS}）
          </p>

          {photoLoading && (
            <p className="mt-3 text-center text-[0.8125rem] text-[var(--muted)]">
              写真を準備中...
            </p>
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
        </div>

        <div className="guest-eye-review-section">
          <p className="guest-eye-review-label">
            ③ 施設の利用が達成感や健康づくりにどのくらい繋がっていますか？
          </p>
          <StarRating
            value={healthRating}
            onChange={setHealthRating}
            disabled={loading}
            name="健康・達成感の評価"
          />
        </div>

        {error && <p className="alert-error mx-5 mb-0 mt-5">{error}</p>}
        {success && <p className="alert-success mx-5 mb-0 mt-5">送信しました。</p>}

        <button
          type="submit"
          disabled={loading || photoLoading}
          className="guest-eye-review-submit btn-primary w-[calc(100%-2.5rem)]"
        >
          {loading ? "送信中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
