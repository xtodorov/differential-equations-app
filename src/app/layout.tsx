import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "MathForge AI — Математиката става ясна",
  description:
    "Научи математика и Wolfram Language стъпка по стъпка. На български, с проверени задачи и личен напредък.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
