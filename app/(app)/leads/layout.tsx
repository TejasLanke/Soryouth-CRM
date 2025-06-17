
'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { UsersRound, ListChecks, UserCheck, Award, UserX } from 'lucide-react'; // Added UserCheck for Prospects

const leadsTabs = [
  { name: 'Leads', href: '/leads/current', icon: ListChecks },
  { name: 'Prospects', href: '/leads/prospects', icon: UserCheck }, // Changed icon for Prospects
  { name: 'Clients', href: '/leads/clients', icon: Award },
  { name: 'Dropped', href: '/leads/dropped', icon: UserX },
];

export default function LeadsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const activeTab = leadsTabs.find(tab => pathname === tab.href || (tab.href !== '/leads' && pathname.startsWith(tab.href)));
  
  // Default to "Lead Management" or a more generic title if no specific tab is matched (e.g., on /leads itself before redirect)
  const pageTitle = activeTab ? activeTab.name : 'Lead Management';
  const pageIcon = activeTab ? activeTab.icon : UsersRound; 
  const pageDescription = activeTab ? `Manage ${activeTab.name.toLowerCase()}.` : "Overview and management of leads.";

  const defaultTabValue = pathname;

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={pageIcon}
      />
      <Tabs defaultValue={defaultTabValue} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
          {leadsTabs.map((tab) => (
            <TabsTrigger key={tab.href} value={tab.href} asChild>
              <Link href={tab.href}>{tab.name}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </>
  );
}
