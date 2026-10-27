import type { Metadata, Viewport } from "next";
import { Golos_Text, PT_Serif } from "next/font/google";
import "./globals.css";

const ui = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

const doc = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-doc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Генератор коммерческих предложений",
  description: "Опишите клиента, его боль и продукт — получите черновик КП с выгодами, этапами, стоимостью и следующим шагом.",
};

export const viewport: Viewport = {
  themeColor: "#e4e7eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${ui.variable} ${doc.variable}`}>
      <body>{children}</body>
    </html>
  );
}
