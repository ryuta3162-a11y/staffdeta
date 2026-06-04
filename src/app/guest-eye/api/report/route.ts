import { NextResponse } from "next/server";
import { getSession } from "@/lib/guest-eye/auth";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

const MAX_PHOTOS = 5;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const formData = await request.formData();
    const requestedStore = String(formData.get("storeName") || "").trim();
    const allowedStores =
      session.storeNames?.length > 0
        ? session.storeNames
        : session.storeName
          ? [session.storeName]
          : [];
    const storeName = allowedStores.includes(requestedStore)
      ? requestedStore
      : session.storeName;

    if (!storeName) {
      return NextResponse.json(
        { error: "店舗が選択されていません" },
        { status: 400 },
      );
    }

    const impression = String(formData.get("impression") || "").trim();
    const healthRating = Number(formData.get("healthRating") || 0);
    const photoFiles = formData
      .getAll("photos")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!impression) {
      return NextResponse.json(
        { error: "所感を入力してください" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(healthRating) || healthRating < 1 || healthRating > 5) {
      return NextResponse.json(
        { error: "健康・達成感の評価を選択してください" },
        { status: 400 },
      );
    }

    if (photoFiles.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `写真は最大${MAX_PHOTOS}枚まで添付できます` },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      action: "submit",
      storeName,
      staffName: session.staffName,
      impression,
      healthRating,
      photos: [] as Array<{
        photoBase64: string;
        photoMimeType: string;
        photoFileName: string;
      }>,
    };

    for (const photo of photoFiles) {
      if (!photo.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "画像ファイルを選択してください" },
          { status: 400 },
        );
      }

      if (photo.size > 3 * 1024 * 1024) {
        return NextResponse.json(
          { error: "写真が大きすぎます。もう一度選び直してください。" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await photo.arrayBuffer());
      (payload.photos as Array<Record<string, string>>).push({
        photoBase64: buffer.toString("base64"),
        photoMimeType: photo.type,
        photoFileName: photo.name,
      });
    }

    await callGuestEyeGas(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
