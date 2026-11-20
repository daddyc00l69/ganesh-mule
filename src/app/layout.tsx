import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import '@/styles/solid-glass.css';
import { Providers } from '@/components/providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f5f5f7',
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
      <body className="antialiased min-h-screen selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
