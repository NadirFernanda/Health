import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planto — O teu próximo plantão está aqui",
  description: "Conectamos médicos plantonistas verificados a clínicas em Angola.",
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
      <body>{children}</body>
    </html>
  );
}
