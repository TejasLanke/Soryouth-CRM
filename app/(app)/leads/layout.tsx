
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { UsersRound, UserCircle } from 'lucide-react';

export default function LeadsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLeadDetailPage = /^\/leads\/[^/]+$/.test(pathname);

  // This layout is now simplified and only wraps the lead detail page.
  // The list pages have their own layouts.
  // The header for the detail page is now handled within the detail page itself.
  
  if (isLeadDetailPage) {
    return <>{children}</>;
  }

  // Fallback for any other routes under /leads that are not detail pages.
  // In our new structure, this won't be hit, but it's good practice.
  return (
    <>
      <PageHeader
        title="Leads"
        description="Lead management section."
        icon={UsersRound}
      />
      {children}
    </>
  );
}
