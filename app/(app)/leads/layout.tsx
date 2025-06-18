
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { UsersRound, ListChecks, UserCheck, Award, UserX, UserCircle } from 'lucide-react';

// Updated tabs for the Summary/Reports section
const summaryTabs = [
  { name: 'Leads Summary', href: '/leads/current', icon: ListChecks },
  { name: 'Prospects Summary', href: '/leads/prospects', icon: UserCheck },
  { name: 'Clients Summary', href: '/leads/clients', icon: Award },
  { name: 'Dropped Summary', href: '/leads/dropped', icon: UserX },
];

export default function LeadsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check if the current path is a lead detail page (e.g., /leads/[leadId])
  // This logic might need adjustment if lead detail pages are moved out of /leads directory
  const isLeadDetailPage = /^\/leads\/[^/]+$/.test(pathname) && !summaryTabs.some(tab => tab.href === pathname);
  
  let activeTab = summaryTabs.find(tab => pathname === tab.href || (tab.href !== '/leads/current' && pathname.startsWith(tab.href)));
  
  let pageTitle = 'Leads Summary & Reports'; // Default title for the section
  let pageIcon = UsersRound; // Default icon for the section
  let pageDescription = "Overview and reports for leads, prospects, clients, and dropped leads.";

  if (isLeadDetailPage) {
    // This part is for individual lead detail pages, IF they remain under /leads route.
    // If list pages are moved out, lead detail pages might also move.
    pageTitle = 'Lead Details'; // Specific title for lead detail page
    pageIcon = UserCircle; 
    pageDescription = "Viewing details for a specific lead.";
    activeTab = undefined; 
  } else if (activeTab) {
    pageTitle = activeTab.name;
    pageIcon = activeTab.icon;
    pageDescription = `Summary reports for ${activeTab.name.replace(' Summary', '').toLowerCase()}.`;
  } else if (pathname === '/leads' || pathname === '/leads/current') {
    // Default to "Leads Summary" tab if on /leads or /leads/current
    activeTab = summaryTabs.find(tab => tab.href === '/leads/current');
    if (activeTab){
        pageTitle = activeTab.name;
        pageIcon = activeTab.icon;
        pageDescription = `Summary reports for ${activeTab.name.replace(' Summary', '').toLowerCase()}.`;
    }
  }

  const defaultTabValue = activeTab ? activeTab.href : pathname;

  return (
    <>
      {!isLeadDetailPage && (
        <PageHeader
          title={pageTitle}
          description={pageDescription}
          icon={pageIcon}
        />
      )}
      {!isLeadDetailPage && (
        <Tabs defaultValue={defaultTabValue} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            {summaryTabs.map((tab) => (
              <TabsTrigger key={tab.href} value={tab.href} asChild>
                <Link href={tab.href}>{tab.name}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {children}
    </>
  );
}
