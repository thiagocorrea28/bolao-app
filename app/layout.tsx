import type { Metadata } from "next";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3080";
const title = "BolãoApp - Copa do Mundo 2026";
const description =
  "Bolão entre amigos para apostar nos placares dos jogos da Copa do Mundo 2026, acompanhar pontuações e disputar o Bolão Premium.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/img/icon.jpg",
        sizes: "1000x1000",
        type: "image/jpeg"
      }
    ],
    shortcut: "/img/icon.jpg",
    apple: [
      {
        url: "/img/icon.jpg",
        sizes: "1000x1000",
        type: "image/jpeg"
      }
    ]
  },
  appleWebApp: {
    capable: true,
    title: "BolãoApp",
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "BolãoApp",
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary",
    title,
    description
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
