import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { callGas } from "@/lib/gas";

const loginSchema = z.object({
  storeName: z.string().min(1, "店舗名を入力してください"),
  staffName: z.string().min(1, "名前を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "入力内容を確認してください" },
        { status: 400 },
      );
    }

    const { storeName, staffName, password } = parsed.data;
    const result = await callGas({
      action: "login",
      storeName,
      staffName,
      password,
    });

    const session = await getSession();
    session.storeName = result.storeName || storeName.trim();
    session.staffName = result.staffName || staffName.trim();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ログインに失敗しました";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
