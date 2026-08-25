import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instagramClassic = Roboto({
  variable: "--font-instagram-classic",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Frameflow — Video Studio",
  description: "Crie variações de vídeos verticais a partir de modelos validados.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} ${instagramClassic.variable}`}>{children}</body>
    </html>
  );
}
