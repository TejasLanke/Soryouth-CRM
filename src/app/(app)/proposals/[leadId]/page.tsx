
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a remnant from a previous routing structure.
// All client-specific proposals are now handled under /proposals/[clientId].
// This component will redirect to the main proposals page.
export default function OldLeadProposalsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Attempt to redirect to the main proposals page.
    // A more sophisticated redirect might try to map leadId to clientId if such a mapping existed.
    router.replace('/proposals');
  }, [router]);

  // Render nothing or a loading indicator while redirecting
  return null;
}
