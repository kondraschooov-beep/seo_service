import type { Metadata } from "next";
import { Golos_Text, Spectral } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
});

const spectral = Spectral({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
});

export const metadata: Metadata = {
  title: "Маяк — SEO-аналитика",
  description:
    "Дашборды по органическому трафику: Яндекс Метрика, Google Search Console и Яндекс Вебмастер в одном отчёте.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${golos.variable} ${spectral.variable}`}>{children}</body>
    </html>
  );
}
