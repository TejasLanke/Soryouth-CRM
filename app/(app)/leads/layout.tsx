
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { UsersRound, ListChecks, UserCheck, Award, UserX, UserCircle } from 'lucide-react'; // Added UserCircle for Lead Detail

const leadsTabs = [
  { name: 'Leads', href: '/leads/current', icon: ListChecks },
  { name: 'Prospects', href: '/leads/prospects', icon: UserCheck },
  { name: 'Clients', href: '/leads/clients', icon: Award },
  { name: 'Dropped', href: '/leads/dropped', icon: UserX },
];

export default function LeadsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check if the current path is a lead detail page
  const isLeadDetailPage = /^\/leads\/[^/]+$/.test(pathname) && !leadsTabs.some(tab => tab.href === pathname);
  
  let activeTab = leadsTabs.find(tab => pathname === tab.href || (tab.href !== '/leads/current' && pathname.startsWith(tab.href)));
  
  let pageTitle = 'Lead Management';
  let pageIcon = UsersRound;
  let pageDescription = "Overview and management of leads, prospects, clients, and dropped leads.";

  if (isLeadDetailPage) {
    // For lead detail page, we might want a generic title or fetch lead name.
    // For now, a generic title is fine. The specific lead name will be in the page content.
    pageTitle = 'Lead Details';
    pageIcon = UserCircle; // Using UserCircle for lead detail
    pageDescription = "Viewing details for a specific lead.";
    activeTab = undefined; // No tab should be active for detail page
  } else if (activeTab) {
    pageTitle = activeTab.name;
    pageIcon = activeTab.icon;
    pageDescription = `Manage ${activeTab.name.toLowerCase()}.`;
  } else if (pathname === '/leads' || pathname === '/leads/current') {
    // Default to "Leads" tab if on /leads or /leads/current
    activeTab = leadsTabs.find(tab => tab.href === '/leads/current');
    if (activeTab){
        pageTitle = activeTab.name;
        pageIcon = activeTab.icon;
        pageDescription = `Manage ${activeTab.name.toLowerCase()}.`;
    }
  }


  const defaultTabValue = activeTab ? activeTab.href : pathname;

  return (
    <>
      {/* PageHeader is rendered for tab views, but not for lead detail page to avoid duplication/conflict */}
      {!isLeadDetailPage && (
        <PageHeader
          title={pageTitle}
          description={pageDescription}
          icon={pageIcon}
        />
      )}
      {/* Tabs are only shown for the list views, not for the detail page */}
      {!isLeadDetailPage && (
        <Tabs defaultValue={defaultTabValue} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            {leadsTabs.map((tab) => (
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
