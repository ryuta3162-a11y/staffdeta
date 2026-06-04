import { NextResponse } from "next/server";
import { z } from "zod";
import { callGuestEyeGas } from "@/lib/guest-eye/gas";
import { staffNameField } from "@/lib/guest-eye/authSchema";

const lookupSchema = z.object({
  staffName: staffNameField,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "入力内容を確認してください" },
        { status: 400 },
      );
    }

    const result = await callGuestEyeGas({
      action: "lookupStaff",
      staffName: parsed.data.staffName,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "確認に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
