import './globals.css';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CRTX - Strategic Intelligence',
  description: 'CRTX Strategic Intelligence – interactive technology trend radar, domains, directory, and report library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen antialiased font-arial'
      )} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}