
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page serves as the entry point for the /leads route (now "Summary").
// It redirects to the default "Leads" tab.
export default function LeadsSummaryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leads/current');
  }, [router]);

  return null; // Or a loading spinner
}
