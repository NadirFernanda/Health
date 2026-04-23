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
      <body>{children}</body>
    </html>
  );
}
