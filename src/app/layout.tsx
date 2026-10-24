import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÇAP ve Yan Dal Yönetim Sistemi | Selçuk Üniversitesi",
  description: "Selçuk Üniversitesi Bilgisayar Mühendisliği Bölümü Çift Ana Dal ve Yan Dal Öğrenci Takip Otomasyonu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
