import { z } from "zod";

export const storeNameField = z.string().min(1, "店舗名を入力してください");

export const staffNameField = z.string().min(1, "名前を入力してください");

export const passwordField = z.string().min(1, "パスワードを入力してください");

export const registerPasswordField = z
  .string()
  .min(6, "パスワードは6文字以上で入力してください");

export const registerSchema = z
  .object({
    staffName: staffNameField,
    password: registerPasswordField,
    storeName: storeNameField.optional(),
    storeNames: z.array(storeNameField).min(1).optional(),
  })
  .refine((data) => Boolean(data.storeName || data.storeNames?.length), {
    message: "店舗を1つ以上選んでください",
  });
