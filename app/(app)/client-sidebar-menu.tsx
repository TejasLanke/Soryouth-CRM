
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NAV_ITEMS } from '@/lib/constants';

export function ClientSidebarMenu() {
  const pathname = usePathname();
  
  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => {
        const isDashboard = item.href === '/dashboard';
        // Check if the current path starts with the item's href,
        // but handle the exact dashboard path correctly.
        const isActive = isDashboard ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard';
        
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
