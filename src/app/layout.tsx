import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "إماراتي كابيتال | منصة الأسهم الإماراتية",
  description: "لوحة مالية عربية مدمجة لمتابعة أسهم سوق دبي وسوق أبوظبي.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
