import { z } from "zod";
import { isValidStore } from "@/lib/stores";

export const storeNameField = z
  .string()
  .min(1, "店舗を選択してください")
  .refine(isValidStore, "選択できない店舗です");

export const staffNameField = z.string().min(1, "名前を入力してください");

export const passwordField = z.string().min(1, "パスワードを入力してください");

export const registerPasswordField = z
  .string()
  .min(6, "パスワードは6文字以上で入力してください");
