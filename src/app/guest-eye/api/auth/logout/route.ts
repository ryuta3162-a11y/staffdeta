import { NextResponse } from "next/server";
import { clearSession } from "@/lib/guest-eye/auth";

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
