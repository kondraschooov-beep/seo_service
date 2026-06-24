import "./globals.css";
import type { ReactNode } from "react";
import { Space_Grotesk, Inter } from "next/font/google";
import { metadata as siteMetadata, jsonLd } from "@/lib/seo";
import Background from "@/components/ui/Background";

export const metadata = siteMetadata;

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

// Inter ships Cyrillic — used for body and as the heading fallback for Russian text.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <Background />
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
