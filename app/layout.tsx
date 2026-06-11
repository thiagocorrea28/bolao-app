import type { Metadata } from "next";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import "./globals.css";

export const metadata: Metadata = {
  title: "BolaoApp",
  description: "Bolao entre amigos para jogos da Copa do Mundo."
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
