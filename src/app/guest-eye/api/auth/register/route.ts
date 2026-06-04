import { NextResponse } from "next/server";
import { getSession } from "@/lib/guest-eye/auth";
import { registerSchema } from "@/lib/guest-eye/authSchema";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "入力内容を確認してください" },
        { status: 400 },
      );
    }

    const { storeName, storeNames, staffName, password } = parsed.data;
    const result = await callGuestEyeGas({
      action: "register",
      storeName: storeNames?.[0] || storeName,
      storeNames,
      staffName,
      password,
    });

    const session = await getSession();
    session.storeName =
      result.storeName || storeNames?.[0] || storeName?.trim() || "";
    session.staffName = result.staffName || staffName.trim();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
