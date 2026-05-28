import { NextResponse } from "next/server";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";

export async function GET() {
  try {
    await callGuestEyeGas({ action: "setup" });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "初期化に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
