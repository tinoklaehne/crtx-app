import './globals.css';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Trend Radar',
  description: 'Interactive technology trend radar visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen antialiased font-arial dark'
      )} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}