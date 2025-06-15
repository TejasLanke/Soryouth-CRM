
import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppLogoIcon } from '@/components/app-logo-icon';
import { APP_NAME } from '@/lib/constants';
import { Toaster } from '@/components/ui/toaster';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 dark:from-background dark:via-primary/10 dark:to-secondary/10 p-4">
      <div className="mb-6">
        <Link href="/" className="flex flex-col items-center gap-2 text-2xl font-bold text-primary">
          <AppLogoIcon className="h-12 w-12" />
          <span className="text-3xl font-headline mt-2">{APP_NAME}</span>
        </Link>
      </div>
      <main className="w-full max-w-md">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

