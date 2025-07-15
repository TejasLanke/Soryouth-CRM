
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page serves as a fallback redirect for the old /leads route.
// It redirects to the primary leads list page.
export default function LeadsSummaryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leads-list');
  }, [router]);

  return null; // Or a loading spinner
}
