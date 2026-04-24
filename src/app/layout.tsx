import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedFreela — Encontra o teu próximo turno",
  description: "Marketplace de saúde que conecta médicos, enfermeiros e técnicos a clínicas em Luanda, Angola.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
