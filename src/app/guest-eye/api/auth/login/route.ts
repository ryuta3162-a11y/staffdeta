import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/guest-eye/auth";
import {
  passwordField,
  registerPasswordField,
  staffNameField,
  storeNameField,
} from "@/lib/guest-eye/authSchema";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

const loginSchema = z.object({
  storeName: storeNameField,
  staffName: staffNameField,
  password: passwordField,
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
    const result = await callGuestEyeGas({
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
