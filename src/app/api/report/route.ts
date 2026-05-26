import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callGas } from "@/lib/gas";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const formData = await request.formData();
    const report = String(formData.get("report") || "").trim();
    const photo = formData.get("photo");

    if (!report) {
      return NextResponse.json(
        { error: "アピールポイントを入力してください" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      action: "submit",
      storeName: session.storeName,
      staffName: session.staffName,
      report,
    };

    if (photo instanceof File && photo.size > 0) {
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
      payload.photoBase64 = buffer.toString("base64");
      payload.photoMimeType = photo.type;
      payload.photoFileName = photo.name;
    }

    await callGas(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
