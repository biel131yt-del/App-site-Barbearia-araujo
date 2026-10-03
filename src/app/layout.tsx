import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Display forte (títulos barbearia) + Inter (corpo e painel)
const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// SEO + PWA — tudo em pt-BR
export const metadata: Metadata = {
  title: "Barbearia Araujo — Agende seu corte",
  description:
    "Agende corte, barba e combo na Barbearia Araujo. Rápido, pelo celular, com confirmação no WhatsApp.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Araujo" },
  icons: { apple: "/apple-touch-icon.png", icon: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A2540",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${display.variable} ${inter.variable} ${geistMono.variable} bg-brand-950 font-sans text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
