import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ナイスプレーシェア",
  description: "スタッフのナイスプレーを共有するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} page-bg min-h-screen antialiased`}
      >
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10 sm:max-w-xl sm:px-8 sm:py-14">
          {children}
        </main>
      </body>
    </html>
  );
}
