
'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { LayoutDashboard, ListChecks, History, Phone, ClipboardCheck } from 'lucide-react';

const dashboardTabs = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Day Report', href: '/dashboard/day-report', icon: ListChecks },
  { name: 'Activity', href: '/dashboard/activity', icon: History },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardCheck },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const activeTab = dashboardTabs.find(tab => pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href)));
  const pageTitle = activeTab ? activeTab.name : 'Dashboard';
  const pageIcon = activeTab ? activeTab.icon : LayoutDashboard;
  
  const defaultTabValue = pathname;


  return (
    <>
      <PageHeader
        title={pageTitle}
        description={`Welcome to Soryouth ${pageTitle}.`}
        icon={pageIcon}
      />
      <Tabs defaultValue={defaultTabValue} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
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
