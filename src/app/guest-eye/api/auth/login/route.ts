import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/guest-eye/auth";
import {
  passwordField,
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

    let registeredStores = [result.storeName || storeName.trim()];
    try {
      const lookup = await callGuestEyeGas({
        action: "lookupStaff",
        staffName,
      });
      if (Array.isArray(lookup.stores) && lookup.stores.length > 0) {
        registeredStores = lookup.stores as string[];
      }
    } catch {
      // ログインは成功しているため、lookup 失敗時は選択店舗のみ保持
    }

    const session = await getSession();
    session.storeNames = registeredStores;
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
