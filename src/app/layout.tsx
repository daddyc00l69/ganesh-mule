import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF9F5',
};

export const metadata: Metadata = {
  title: 'Ganesh Mule | 100% Raw Wild Forest Honey in Solid Glass',
  description:
    'Ganesh Mule Artisanal Raw Honey. Single-origin, unheated, cold-extracted and NMR lab certified 100% pure in heavy solid glass jars.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen selection:bg-amber-500/20 selection:text-amber-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
