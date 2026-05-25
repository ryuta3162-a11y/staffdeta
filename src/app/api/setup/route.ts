import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export async function GET() {
  try {
    await callGas({ action: "setup" });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "初期化に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
