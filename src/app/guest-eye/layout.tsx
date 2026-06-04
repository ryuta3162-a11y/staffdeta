import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ゲストアイ",
  description: "施設利用者向けのフィードバックアプリ",
};

export default function GuestEyeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="guest-eye-theme">{children}</div>;
}
