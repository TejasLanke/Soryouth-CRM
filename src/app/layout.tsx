
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Soryouth - Minimal Test',
  description: 'Minimal test to resolve module loading issue.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Font imports removed for minimal test */}
      </head>
      <body className="font-body antialiased">
        {children}
        {/* Toaster removed for minimal test */}
      </body>
    </html>
  );
}
