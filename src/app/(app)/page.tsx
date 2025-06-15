
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is the default page for the (app) route group.
// It redirects to the dashboard.
export default function AppRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // Or a loading spinner, but redirect is usually fast enough
}

    