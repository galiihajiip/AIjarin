import type { Metadata, Viewport } from 'next';

import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

import './globals.css';

export const metadata: Metadata = {
  title: 'AIjarin — Agen SIGMA',
  description:
    'LMS gamifikasi berbasis AI untuk siswa jalur afirmasi. Belajar logika komputasi, kalahkan ERROR-X!',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
