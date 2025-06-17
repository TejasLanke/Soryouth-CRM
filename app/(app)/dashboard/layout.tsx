
'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { LayoutDashboard, ListChecks } from 'lucide-react';

const dashboardTabs = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Day Report', href: '/dashboard/day-report', icon: ListChecks },
  // Add other dashboard pages here in the future
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Determine the PageHeader title based on the active tab
  const activeTab = dashboardTabs.find(tab => pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href)));
  const pageTitle = activeTab ? activeTab.name : 'Dashboard';
  const pageIcon = activeTab ? activeTab.icon : LayoutDashboard;
  
  // Determine the default active tab for Tabs component
  // If current path is just /dashboard, Overview is active.
  // Otherwise, it's the specific sub-page.
  const defaultTabValue = pathname === '/dashboard' ? '/dashboard' : pathname;


  return (
    <>
      <PageHeader
        title={pageTitle}
        description={`Welcome to Soryouth ${pageTitle}.`}
        icon={pageIcon}
      />
      <Tabs defaultValue={defaultTabValue} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          {dashboardTabs.map((tab) => (
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
