import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ゲストアイ",
  description: "週1回ジムを利用する方向けのアプリ",
};

export default function GuestEyeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="guest-eye-theme">{children}</div>;
}
