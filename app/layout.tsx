import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FURIA Fan Platform',
  description: 'Plataforma de fãs da FURIA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}