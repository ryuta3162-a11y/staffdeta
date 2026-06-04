import { NextResponse } from "next/server";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

export async function GET() {
  try {
    const result = await callGuestEyeGas({ action: "getStoreData" });
    return NextResponse.json({ stores: result.stores || [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "店舗データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
